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

#define BUFF 1024
#define MAXUSERNAME 32

pthread_mutex_t task_mutex = PTHREAD_MUTEX_INITIALIZER;
pthread_cond_t task_cond = PTHREAD_COND_INITIALIZER;
volatile sig_atomic_t latest_client_pid = 0;

typedef struct{
    pid_t client_pid;
    int fd_c2s;
    int fd_s2c;
    char path_c2s[BUFF];
    char path_s2c[BUFF];
    char username[MAXUSERNAME];
    int is_logged_in;
    int tasks_num;
    int next_res_id;
    struct canvas* controlled_canvas[BUFF];
    int controlled_canvas_cnt;
} client_t;

client_t clients[BUFF];
int num_clients = 0;

typedef struct client_task {
    char cmd[BUFF];
    int fd_c2s;
    int fd_s2c;
    pid_t client_pid;
    struct client_task* next;
    int task_id;
} client_task_t;

client_task_t* task_head = NULL;
client_task_t* task_tail = NULL;

void signal_handler(int sig, siginfo_t *info, void *ucontext){
    (void)sig; (void)ucontext;
    latest_client_pid = info->si_pid;
}

int authorisation (const char *username, pid_t client_pid){
    FILE *fptr = fopen("users.txt", "r");
    if (fptr == NULL) return -3;

    char user[MAXUSERNAME];
    int balance;
    while (fscanf(fptr, "%s %d", user, &balance) != EOF){
        if(strcmp(username, user) == 0){
            fclose(fptr);
            if (balance > 0){
                for (int i = 0; i < num_clients; i++){
                    if (clients[i].client_pid == client_pid){
                        clients[i].is_logged_in = 1;
                        strncpy(clients[i].username, username, MAXUSERNAME - 1);
                        clients[i].username[MAXUSERNAME - 1] = '\0';
                        break;
                    }
                }
                return balance;
            } else {
                return -2;
            }
        }
    }
    fclose(fptr);
    return -1;
}

void cmd_handler(char* cmd, client_t* client, pid_t client_pid, char* output){
    if (strstr(cmd, "Login") != NULL) {
        char username[MAXUSERNAME];
        sscanf(cmd, "Login %s", username);
        int res = authorisation(username, client_pid);
        if (res >= 0){
            sprintf(output, "%d\n", res);
            return;
        } else {
            if (res == -2){
                strcpy(output, "Reject BALANCE\n");
                return;
            } else {
                strcpy(output,"Reject UNAUTHORISED\n");
                return;
            }
        }
    }
    
    if (client == NULL || client->is_logged_in == 0){
        strcpy(output, "Not logged in\n");
        return;
    }
    
    if (strstr(cmd, "Disconnect") != NULL){
        strcpy(output, "0\n");
        client->is_logged_in = 0;
        return;
    } 

    if (strstr(cmd, "create_canvas") != NULL) {
        size_t w, h;
        color_t c;
        if (sscanf(cmd, "create_canvas %zu %zu %u", &w, &h, &c) == 3) {
            if (w == 0 || h == 0){
                strcpy(output, "-2\n");
                return;
            }
            struct canvas* canvas = animate_create_canvas(w, h, c);
            if (canvas == NULL){
                strcpy(output, "-3\n");
                return;
            }
            client->controlled_canvas[client->controlled_canvas_cnt++] = canvas;
            sprintf(output, "0 %lu\n", (uint64_t)canvas);
            return;
        }
        sprintf(output, "-1\n");
        return;
    }
    sprintf(output, "-1\n");
}

void* worker_thread(void* arg){
    (void)arg;
    while (1){
        pthread_mutex_lock(&task_mutex);
        while (task_head == NULL){
            pthread_cond_wait(&task_cond, &task_mutex);     
        }
        client_task_t* task = task_head;
        task_head = task_head->next;
        if (task_head == NULL) task_tail = NULL;
        pthread_mutex_unlock(&task_mutex);

        client_t* client = NULL;
        char output[BUFF] = {0};
        
        pthread_mutex_lock(&task_mutex);
        for (int i = 0; i < num_clients; i++){
            if (clients[i].client_pid == task->client_pid){
                client = &clients[i];
                break;
            }
        }
        pthread_mutex_unlock(&task_mutex);

        cmd_handler(task->cmd, client, task->client_pid, output);

        if (client != NULL){
            while (1){
                if (task->task_id == client->next_res_id){
                    if (strcmp(output, "0\n") == 0 && strstr(task->cmd, "Disconnect") != NULL){
                        write(task->fd_s2c, output, strlen(output));
                        usleep(500); 
                        close(client->fd_c2s);
                        close(client->fd_s2c);
                        unlink(client->path_c2s);
                        unlink(client->path_s2c);
                        

                        pthread_mutex_lock(&task_mutex);
                        for (int i = 0; i < num_clients; i++) {
                            if (clients[i].client_pid == task->client_pid) {
                                for (int j = i; j < num_clients - 1; j++) {
                                    clients[j] = clients[j+1];
                                }
                                num_clients--;
                                break;
                            }
                        }
                        pthread_mutex_unlock(&task_mutex);
                        break;
                    }
                    write(task->fd_s2c, output, strlen(output));
                    client->next_res_id++;
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

int main(int argc, char** argv, char** envp) {
    (void)envp;
    if (argc < 2) {
        fprintf(stderr, "Usage: %s <threadpool size>\n", argv[0]);
        return 1;
    }
    printf("Server PID: %d.\n", getpid());
    
    int pool_size = atoi(argv[1]);
    pthread_t* threads = malloc(sizeof(pthread_t) * pool_size);
    for (int i = 0; i < pool_size; i++){
        pthread_create(&threads[i], NULL, worker_thread, NULL);
    }

    struct sigaction sa;
    sa.sa_sigaction = signal_handler;
    sa.sa_flags = SA_SIGINFO | SA_RESTART;
    sigemptyset(&sa.sa_mask);
    sigaction(SIGUSR1, &sa, NULL);

    while(1){
        if (latest_client_pid != 0 && num_clients < BUFF){
            char path_c2s[BUFF], path_s2c[BUFF];
            sprintf(path_c2s, "FIFO_C2S_%d", latest_client_pid);
            sprintf(path_s2c, "FIFO_S2C_%d", latest_client_pid);

            unlink(path_c2s); unlink(path_s2c);
            mkfifo(path_c2s, 0666); mkfifo(path_s2c, 0666);

            kill(latest_client_pid, SIGUSR2);

            client_t new_client;
            new_client.client_pid = latest_client_pid;
            new_client.fd_c2s = open(path_c2s, O_RDONLY | O_NONBLOCK);
            new_client.fd_s2c = open(path_s2c, O_WRONLY);
            new_client.is_logged_in = 0;
            new_client.tasks_num = 0;
            new_client.next_res_id = 1;
            new_client.controlled_canvas_cnt = 0;
            strcpy(new_client.path_c2s, path_c2s);
            strcpy(new_client.path_s2c, path_s2c);

            pthread_mutex_lock(&task_mutex);
            clients[num_clients++] = new_client;
            pthread_mutex_unlock(&task_mutex);
            latest_client_pid = 0;
        }

        fd_set read_fds;
        FD_ZERO(&read_fds);
        int max_fd = -1;
        
        pthread_mutex_lock(&task_mutex);
        for (int i = 0; i < num_clients; i++){
            FD_SET(clients[i].fd_c2s, &read_fds);
            if (clients[i].fd_c2s > max_fd) max_fd = clients[i].fd_c2s;
        }
        pthread_mutex_unlock(&task_mutex);

        struct timeval tv = {0, 10000}; 
        int waiting = select(max_fd + 1, &read_fds, NULL, NULL, &tv);
        
        if (waiting > 0){
            pthread_mutex_lock(&task_mutex);
            for (int i = 0; i < num_clients; i++){
                if (FD_ISSET(clients[i].fd_c2s, &read_fds)){
                    char cmd[BUFF] = {0};
                    ssize_t size_read = read(clients[i].fd_c2s, cmd, BUFF - 1);
                    if (size_read > 0){
                        cmd[size_read] = '\0';
                        cmd[strcspn(cmd, "\r\n")] = '\0';


                        if (strlen(cmd) == 0) continue;

                        client_task_t* new_task = malloc(sizeof(client_task_t));
                        new_task->fd_c2s = clients[i].fd_c2s;
                        new_task->fd_s2c = clients[i].fd_s2c;
                        new_task->client_pid = clients[i].client_pid;
                        strcpy(new_task->cmd, cmd);
                        new_task->next = NULL;
                        clients[i].tasks_num++;
                        new_task->task_id = clients[i].tasks_num;

                        if (task_head == NULL){
                            task_head = new_task;
                            task_tail = new_task;
                        } else {
                            task_tail->next = new_task;
                            task_tail = new_task;
                        }
                        pthread_cond_signal(&task_cond);
                    } else if (size_read == 0 || (size_read < 0 && errno != EAGAIN)) {
                        int found = 0;
                        for (int j = 0; j < num_clients; j++) {
                            if (clients[j].fd_c2s == clients[i].fd_c2s) {
                                found = 1;
                                break;
                            }
                        }

                        if (found) {
                        close(clients[i].fd_c2s);
                        close(clients[i].fd_s2c);
                        unlink(clients[i].path_c2s);
                        unlink(clients[i].path_s2c);
                        for (int j = i; j < num_clients - 1 ; j++){
                            clients[j] = clients[j+1];
                        }
                        num_clients--;
                        i--; 
                    }
                }
            }
            pthread_mutex_unlock(&task_mutex);
        }
    }
    free(threads);
    return 0;
}
}