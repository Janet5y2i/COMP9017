#include "animate/animate.h"
#include <unistd.h>
#include <stdio.h>
#include <stdlib.h>
#include <signal.h>
#include <errno.h>
#include <fcntl.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <string.h>
#include <pthread.h>
#include <stdint.h>

#define BUFF 1024
#define MAXUSERNAME 32

pthread_mutex_t task_mutex = PTHREAD_MUTEX_INITIALIZER;
pthread_cond_t task_cond = PTHREAD_COND_INITIALIZER;
pthread_mutex_t state_mutex = PTHREAD_MUTEX_INITIALIZER;

static int connect_pipe[2];

typedef struct {
    pid_t client_pid;
    int fd_c2s;
    int fd_s2c;
    char path_c2s[BUFF];
    char path_s2c[BUFF];
    char username[MAXUSERNAME];
    int is_logged_in;
    int tasks_num;
    int next_res_id;
    struct canvas *controlled_canvas[BUFF];
    int controlled_canvas_cnt;
} client_t;

client_t clients[BUFF];
int num_clients = 0;

typedef struct client_task {
    char cmd[BUFF];
    int fd_c2s;
    int fd_s2c;
    pid_t client_pid;
    struct client_task *next;
    int task_id;
} client_task_t;

client_task_t *task_head = NULL;
client_task_t *task_tail = NULL;

typedef struct {
    struct canvas *canvas;
    pid_t owner_pid;
    pid_t shared_client[BUFF];
    int shared_cnt;
} canvas_record_t;

canvas_record_t using_canvas[BUFF];
int using_canvas_cnt = 0;

typedef struct {
    struct sprite *sprite;
    pid_t owner_pid;
    int refcnt;
} sprite_record_t;

sprite_record_t using_sprite[BUFF];
int using_sprite_cnt = 0;

typedef struct {
    struct sprite_placement *placement;
    struct sprite *sprite;
    pid_t owner_pid;
} placement_record_t;

placement_record_t using_placement[BUFF];
int using_placement_cnt = 0;

static void signal_handler(int sig, siginfo_t *info, void *ucontext) {
    (void)sig;
    (void)ucontext;
    pid_t client_pid = info->si_pid;
    ssize_t written = write(connect_pipe[1], &client_pid, sizeof(client_pid));
    (void)written;
}

static client_t *find_client_by_pid(pid_t pid) {
    for (int i = 0; i < BUFF; i++) {
        if (clients[i].client_pid == pid) {
            return &clients[i];
        }
    }
    return NULL;
}

static void remove_client_slot(client_t *client) {
    if (client == NULL || client->client_pid == 0) {
        return;
    }
    pthread_mutex_lock(&state_mutex);
    close(client->fd_c2s);
    close(client->fd_s2c);
    unlink(client->path_c2s);
    unlink(client->path_s2c);
    memset(client, 0, sizeof(client_t));
    if (num_clients > 0) {
        num_clients--;
    }
    pthread_mutex_unlock(&state_mutex);
}

int authorisation(const char *username, client_t *client) {
    FILE *fptr = fopen("users.txt", "r");
    if (fptr == NULL) {
        return -3;
    }

    char user[MAXUSERNAME];
    int balance;
    while (fscanf(fptr, "%s %d", user, &balance) != EOF) {
        if (strcmp(username, user) == 0) {
            strncpy(client->username, username, MAXUSERNAME - 1);
            client->username[MAXUSERNAME - 1] = '\0';
            if (balance > 0) {
                client->is_logged_in = 1;
                fclose(fptr);
                return balance;
            }
            fclose(fptr);
            return -2;
        }
    }
    fclose(fptr);
    return -1;
}

static canvas_record_t *find_canvas_record(uint64_t canvas_id) {
    struct canvas *canvas = (struct canvas *)(uintptr_t)canvas_id;
    for (int i = 0; i < using_canvas_cnt; i++) {
        if (using_canvas[i].canvas == canvas) {
            return &using_canvas[i];
        }
    }
    return NULL;
}

static int client_can_access_canvas(client_t *client, canvas_record_t *record) {
    if (client == NULL || record == NULL) {
        return 0;
    }
    if (record->owner_pid == client->client_pid) {
        return 1;
    }
    for (int i = 0; i < record->shared_cnt; i++) {
        if (record->shared_client[i] == client->client_pid) {
            return 1;
        }
    }
    return 0;
}

static sprite_record_t *find_sprite_record(uint64_t sprite_id) {
    struct sprite *sprite = (struct sprite *)(uintptr_t)sprite_id;
    for (int i = 0; i < using_sprite_cnt; i++) {
        if (using_sprite[i].sprite == sprite) {
            return &using_sprite[i];
        }
    }
    return NULL;
}

static placement_record_t *find_placement_record(uint64_t placement_id) {
    struct sprite_placement *placement =
        (struct sprite_placement *)(uintptr_t)placement_id;
    for (int i = 0; i < using_placement_cnt; i++) {
        if (using_placement[i].placement == placement) {
            return &using_placement[i];
        }
    }
    return NULL;
}

static void create_canvas_cmd(client_t *client, pid_t client_pid, size_t height,
                              size_t width, color_t c, char *output) {
    if (height == 0 || width == 0) {
        strcpy(output, "-2\n");
        return;
    }
    struct canvas *canvas = animate_create_canvas(height, width, c);
    if (canvas == NULL) {
        strcpy(output, "-3\n");
        return;
    }
    pthread_mutex_lock(&state_mutex);
    if (using_canvas_cnt >= BUFF || client->controlled_canvas_cnt >= BUFF) {
        animate_destroy_canvas(canvas);
        pthread_mutex_unlock(&state_mutex);
        strcpy(output, "-3\n");
        return;
    }
    using_canvas[using_canvas_cnt].canvas = canvas;
    using_canvas[using_canvas_cnt].owner_pid = client_pid;
    using_canvas[using_canvas_cnt].shared_cnt = 0;
    using_canvas_cnt++;
    client->controlled_canvas[client->controlled_canvas_cnt++] = canvas;
    sprintf(output, "0 %lu\n", (unsigned long)(uint64_t)(uintptr_t)canvas);
    pthread_mutex_unlock(&state_mutex);
}

static void register_sprite(struct sprite *sprite, pid_t client_pid, char *output) {
    if (sprite == NULL) {
        strcpy(output, "-3\n");
        return;
    }
    pthread_mutex_lock(&state_mutex);
    if (using_sprite_cnt >= BUFF) {
        animate_destroy_sprite(sprite);
        pthread_mutex_unlock(&state_mutex);
        strcpy(output, "-3\n");
        return;
    }
    using_sprite[using_sprite_cnt].sprite = sprite;
    using_sprite[using_sprite_cnt].owner_pid = client_pid;
    using_sprite[using_sprite_cnt].refcnt = 0;
    using_sprite_cnt++;
    sprintf(output, "0 %lu\n", (unsigned long)(uint64_t)(uintptr_t)sprite);
    pthread_mutex_unlock(&state_mutex);
}

static void generate_cmd(client_t *client, uint64_t canvas_id, const char *filename,
                         size_t start, size_t end, size_t frame_rate, char *output) {
    if (end < start) {
        strcpy(output, "-2\n");
        return;
    }
    canvas_record_t *record = find_canvas_record(canvas_id);
    if (record == NULL || !client_can_access_canvas(client, record)) {
        strcpy(output, "-1\n");
        return;
    }
    size_t frame_bytes = animate_frame_size_bytes(record->canvas);
    FILE *fptr = fopen(filename, "wb");
    if (fptr == NULL) {
        strcpy(output, "-3\n");
        return;
    }
    void *buf = malloc(frame_bytes);
    if (buf == NULL) {
        fclose(fptr);
        strcpy(output, "-3\n");
        return;
    }
    for (size_t frame = start; frame <= end; frame++) {
        animate_generate_frame(record->canvas, frame, frame_rate, buf);
        if (fwrite(buf, 1, frame_bytes, fptr) != frame_bytes) {
            free(buf);
            fclose(fptr);
            strcpy(output, "-3\n");
            return;
        }
    }
    free(buf);
    fclose(fptr);
    strcpy(output, "0\n");
}

void cmd_handler(char *cmd, client_t *client, pid_t client_pid, char *output) {
    if (strstr(cmd, "Login") != NULL) {
        char username[MAXUSERNAME];
        if (sscanf(cmd, "Login %31s", username) != 1 || client == NULL) {
            strcpy(output, "Reject UNAUTHORISED\n");
            return;
        }
        int res = authorisation(username, client);
        if (res > 0) {
            sprintf(output, "%d\n", res);
        } else if (res == -2) {
            strcpy(output, "Reject BALANCE\n");
        } else if (res == -3) {
            strcpy(output, "-3\n");
        } else {
            strcpy(output, "Reject UNAUTHORISED\n");
        }
        return;
    }

    if (client == NULL || client->is_logged_in == 0) {
        strcpy(output, "Not logged in\n");
        return;
    }

    if (strstr(cmd, "Disconnect") != NULL) {
        strcpy(output, "0\n");
        client->is_logged_in = 0;
        return;
    }

    size_t height, width;
    color_t color;
    uint64_t id;
    char filename[BUFF];
    ssize_t x, y, vx, vy, ax, ay;
    size_t start, end, frame_rate;
    int filled;

    if (strstr(cmd, "create_canvas") != NULL) {
        if (sscanf(cmd, "create_canvas %zu %zu %u", &height, &width, &color) == 3) {
            create_canvas_cmd(client, client_pid, height, width, color, output);
            return;
        }
        strcpy(output, "-1\n");
        return;
    }

    if (strstr(cmd, "create_sprite") != NULL) {
        if (sscanf(cmd, "create_sprite %1023s", filename) == 1) {
            register_sprite(animate_create_sprite(filename), client_pid, output);
            return;
        }
        strcpy(output, "-1\n");
        return;
    }

    if (strstr(cmd, "create_rectangle") != NULL) {
        if (sscanf(cmd, "create_rectangle %zu %zu %u %d", &width, &height, &color, &filled) == 4) {
            register_sprite(animate_create_rectangle(width, height, color, filled != 0),
                              client_pid, output);
            return;
        }
        strcpy(output, "-1\n");
        return;
    }

    if (strstr(cmd, "create_circle") != NULL) {
        size_t radius;
        if (sscanf(cmd, "create_circle %zu %u %d", &radius, &color, &filled) == 3) {
            register_sprite(animate_create_circle(radius, color, filled != 0), client_pid, output);
            return;
        }
        strcpy(output, "-1\n");
        return;
    }

    if (strstr(cmd, "place_sprite") != NULL) {
        uint64_t canvas_id, sprite_id;
        if (sscanf(cmd, "place_sprite %lu %lu %zd %zd", (unsigned long *)&canvas_id,
                   (unsigned long *)&sprite_id, &x, &y) == 4) {
            canvas_record_t *crec = find_canvas_record(canvas_id);
            sprite_record_t *srec = find_sprite_record(sprite_id);
            if (crec == NULL || srec == NULL || !client_can_access_canvas(client, crec) ||
                srec->owner_pid != client_pid) {
                strcpy(output, "-1\n");
                return;
            }
            struct sprite_placement *placement =
                animate_place_sprite(crec->canvas, srec->sprite, x, y);
            if (placement == NULL) {
                strcpy(output, "-3\n");
                return;
            }
            pthread_mutex_lock(&state_mutex);
            if (using_placement_cnt >= BUFF) {
                animate_destroy_placement(placement);
                pthread_mutex_unlock(&state_mutex);
                strcpy(output, "-3\n");
                return;
            }
            srec->refcnt++;
            using_placement[using_placement_cnt].placement = placement;
            using_placement[using_placement_cnt].sprite = srec->sprite;
            using_placement[using_placement_cnt].owner_pid = client_pid;
            using_placement_cnt++;
            sprintf(output, "0 %lu\n", (unsigned long)(uint64_t)(uintptr_t)placement);
            pthread_mutex_unlock(&state_mutex);
            return;
        }
        strcpy(output, "-1\n");
        return;
    }

    if (strstr(cmd, "set_animation") != NULL) {
        if (sscanf(cmd, "set_animation %lu %zd %zd %zd %zd", (unsigned long *)&id, &vx, &vy,
                   &ax, &ay) == 5) {
            placement_record_t *prec = find_placement_record(id);
            if (prec == NULL || prec->owner_pid != client_pid) {
                strcpy(output, "-1\n");
                return;
            }
            animate_set_animation_params(prec->placement, vx, vy, ax, ay);
            strcpy(output, "0\n");
            return;
        }
        strcpy(output, "-1\n");
        return;
    }

    if (strstr(cmd, "generate") != NULL) {
        if (sscanf(cmd, "generate %lu %1023s %zu %zu %zu", (unsigned long *)&id, filename,
                   &start, &end, &frame_rate) == 5) {
            generate_cmd(client, id, filename, start, end, frame_rate, output);
            return;
        }
        strcpy(output, "-1\n");
        return;
    }

    sprintf(output, "-1\n");
}

void *worker_thread(void *arg) {
    (void)arg;
    while (1) {
        pthread_mutex_lock(&task_mutex);
        while (task_head == NULL) {
            pthread_cond_wait(&task_cond, &task_mutex);
        }

        client_task_t *task = task_head;
        task_head = task_head->next;
        if (task_head == NULL) {
            task_tail = NULL;
        }
        pthread_mutex_unlock(&task_mutex);

        client_t *client = find_client_by_pid(task->client_pid);
        char output[BUFF] = {0};
        cmd_handler(task->cmd, client, task->client_pid, output);

        if (client != NULL) {
            while (1) {
                if (task->task_id == client->next_res_id) {
                    write(task->fd_s2c, output, strlen(output));
                    client->next_res_id++;
                    if (strstr(output, "Reject") != NULL || strstr(task->cmd, "Disconnect") != NULL) {
                        usleep(500);
                        remove_client_slot(client);
                    }
                    break;
                }
                usleep(100);
            }
        } else {
            write(task->fd_s2c, "0\n", 2);
        }
        free(task);
    }
    return NULL;
}

static void accept_new_connection(pid_t processing_pid) {
    char path_c2s[BUFF], path_s2c[BUFF];
    sprintf(path_c2s, "FIFO_C2S_%d", processing_pid);
    sprintf(path_s2c, "FIFO_S2C_%d", processing_pid);

    unlink(path_c2s);
    unlink(path_s2c);
    if (mkfifo(path_c2s, 0666) != 0 || mkfifo(path_s2c, 0666) != 0) {
        return;
    }

    int fd_c2s = open(path_c2s, O_RDWR | O_NONBLOCK);
    int fd_s2c = open(path_s2c, O_RDWR | O_NONBLOCK);
    if (fd_c2s == -1 || fd_s2c == -1) {
        if (fd_c2s != -1) close(fd_c2s);
        if (fd_s2c != -1) close(fd_s2c);
        unlink(path_c2s);
        unlink(path_s2c);
        return;
    }

    kill(processing_pid, SIGUSR2);

    pthread_mutex_lock(&state_mutex);
    for (int i = 0; i < BUFF; i++) {
        if (clients[i].client_pid == 0) {
            memset(&clients[i], 0, sizeof(client_t));
            clients[i].client_pid = processing_pid;
            clients[i].fd_c2s = fd_c2s;
            clients[i].fd_s2c = fd_s2c;
            clients[i].next_res_id = 1;
            strcpy(clients[i].path_c2s, path_c2s);
            strcpy(clients[i].path_s2c, path_s2c);
            num_clients++;
            break;
        }
    }
    pthread_mutex_unlock(&state_mutex);
}

static void drain_connect_pipe(void) {
    pid_t processing_pid;
    while (read(connect_pipe[0], &processing_pid, sizeof(processing_pid)) ==
           (ssize_t)sizeof(processing_pid)) {
        pthread_mutex_lock(&state_mutex);
        int reject = num_clients >= BUFF || find_client_by_pid(processing_pid) != NULL;
        pthread_mutex_unlock(&state_mutex);
        if (!reject) {
            accept_new_connection(processing_pid);
        }
    }
}

int main(int argc, char **argv, char **envp) {
    (void)envp;
    if (argc < 2) {
        fprintf(stderr, "Usage: %s <threadpool size>\n", argv[0]);
        return 1;
    }

    signal(SIGPIPE, SIG_IGN);

    if (pipe(connect_pipe) != 0) {
        perror("pipe");
        return 1;
    }
    fcntl(connect_pipe[0], F_SETFL, O_NONBLOCK);
    fcntl(connect_pipe[1], F_SETFL, O_NONBLOCK);

    printf("Server PID: %d\n", getpid());
    fflush(stdout);

    struct sigaction sa;
    sa.sa_sigaction = signal_handler;
    sa.sa_flags = SA_SIGINFO;
    sigemptyset(&sa.sa_mask);
    sigaction(SIGUSR1, &sa, NULL);

    int pool_size = atoi(argv[1]);
    if (pool_size <= 0) {
        return 1;
    }

    pthread_t *threads = malloc(sizeof(pthread_t) * (size_t)pool_size);
    if (threads == NULL) {
        return 1;
    }
    for (int i = 0; i < pool_size; i++) {
        pthread_create(&threads[i], NULL, worker_thread, NULL);
    }

    while (1) {
        drain_connect_pipe();

        fd_set read_fds;
        FD_ZERO(&read_fds);
        int max_fd = connect_pipe[0];
        FD_SET(connect_pipe[0], &read_fds);

        pthread_mutex_lock(&state_mutex);
        for (int i = 0; i < BUFF; i++) {
            if (clients[i].client_pid != 0 && clients[i].fd_c2s >= 0) {
                FD_SET(clients[i].fd_c2s, &read_fds);
                if (clients[i].fd_c2s > max_fd) {
                    max_fd = clients[i].fd_c2s;
                }
            }
        }
        pthread_mutex_unlock(&state_mutex);

        struct timeval tv = {0, 10000};
        int waiting = select(max_fd + 1, &read_fds, NULL, NULL, &tv);
        if (waiting <= 0) {
            continue;
        }

        if (FD_ISSET(connect_pipe[0], &read_fds)) {
            drain_connect_pipe();
        }

        char cmd[BUFF];
        for (int i = 0; i < BUFF; i++) {
            pthread_mutex_lock(&state_mutex);
            int active = clients[i].client_pid != 0 && clients[i].fd_c2s >= 0 &&
                         FD_ISSET(clients[i].fd_c2s, &read_fds);
            pid_t pid = clients[i].client_pid;
            int fd_c2s = clients[i].fd_c2s;
            int fd_s2c = clients[i].fd_s2c;
            pthread_mutex_unlock(&state_mutex);

            if (!active) {
                continue;
            }

            ssize_t size_read = read(fd_c2s, cmd, BUFF - 1);
            if (size_read > 0) {
                cmd[size_read] = '\0';
                cmd[strcspn(cmd, "\r\n")] = '\0';

                client_task_t *new_task = malloc(sizeof(client_task_t));
                if (new_task == NULL) {
                    continue;
                }
                new_task->fd_c2s = fd_c2s;
                new_task->fd_s2c = fd_s2c;
                new_task->client_pid = pid;
                strncpy(new_task->cmd, cmd, BUFF - 1);
                new_task->cmd[BUFF - 1] = '\0';
                new_task->next = NULL;

                pthread_mutex_lock(&state_mutex);
                client_t *client = find_client_by_pid(pid);
                if (client != NULL) {
                    client->tasks_num++;
                    new_task->task_id = client->tasks_num;
                } else {
                    new_task->task_id = 1;
                }
                pthread_mutex_unlock(&state_mutex);

                pthread_mutex_lock(&task_mutex);
                if (task_head == NULL) {
                    task_head = new_task;
                    task_tail = new_task;
                } else {
                    task_tail->next = new_task;
                    task_tail = new_task;
                }
                pthread_cond_signal(&task_cond);
                pthread_mutex_unlock(&task_mutex);
            } else if (size_read == 0) {
                remove_client_slot(find_client_by_pid(pid));
            }
        }
    }

    free(threads);
    return 0;
}
