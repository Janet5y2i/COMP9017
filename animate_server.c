
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
//global variable to store the latest client pid
volatile sig_atomic_t latest_client_pid = 0;

//client struct
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
    //record the canvas client create;
    struct canvas* controlled_canvas[BUFF];
    int controlled_canvas_cnt;
} client_t;

//record the clients info
client_t clients[BUFF];
int num_clients = 0;

//RPC task struct
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

typedef struct {
    struct canvas* canvas;
    pid_t client_pid;
    pid_t shared_client[BUFF];
    int shared_cnt;
} canvas_t;

canvas_t using_canvas[BUFF];
int using_canvas_cnt = 0;


typedef struct {
    struct sprite* sprite;
    pid_t client_pid;
} sprite_t;

sprite_t using_sprite[BUFF];
int using_sprite_cnt = 0;

typedef struct {
    struct sprite_placement* placement;
    pid_t client_pid;
} placement_t;

placement_t using_placement[BUFF];
int using_placement_cnt = 0;

void signal_handler(int sig, siginfo_t *info, void *ucontext){
    latest_client_pid = info->si_pid;
}

int authorisation (const char *username, pid_t client_pid){
    FILE *fptr = fopen("users.txt", "r");
    if (fptr == NULL){
        return -3;
    }

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
                return -2; //balance < 0
            }
        }
    }

    fclose(fptr);
    //user not exist
    return -1;

}

void create_canvas(client_t* client, pid_t client_pid, size_t w, size_t h, color_t c, char* output){
    if (w == 0 || h == 0){
        strcpy(output, "-2\n");
        return;
    }
    struct canvas* canvas = animate_create_canvas(w, h, c);
    if (canvas == NULL){
        //internal error when creating
        strcpy(output, "-3\n");
        return;
    }

    //record the canvas, lock the mutex when modifying
    pthread_mutex_lock(&task_mutex);
    if (using_canvas_cnt < BUFF){
        using_canvas[using_canvas_cnt].canvas = canvas;
        using_canvas[using_canvas_cnt].client_pid = client_pid;
        using_canvas[using_canvas_cnt].shared_cnt = 0;
        using_canvas_cnt++;

        client->controlled_canvas[client->controlled_canvas_cnt] = canvas;
        client->controlled_canvas_cnt++;

        uint64_t canvas_id = (uint64_t)canvas;
        sprintf(output, "0 %lu\n", canvas_id);
    } else {
        sprintf(output, "-3\n");
        //destroy the canvas if cannot record
        animate_destroy_canvas(canvas); 
    }

    pthread_mutex_unlock(&task_mutex);
}

void cmd_handler(char* cmd, client_t* client, pid_t client_pid, char* output){
    int fd_s2c = client->fd_s2c;
    int fd_c2s = client->fd_c2s;

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
    
    
    
    if (client->is_logged_in == 0){
            strcpy(output, "Not logged in\n");
            return;
        }
    
    if (strstr(cmd, "Disconnect") != NULL){
        strcpy(output, "0\n");
        //printf("Client %d disconnected.\n", client_pid);
        client->is_logged_in = 0;
        return;
    } 

    if (strstr(cmd, "create_canvas") != NULL) {
        uint64_t canvas_id;
        size_t w, h;
        color_t c;
        if (sscanf(cmd, "create_canvas %zu %zu %u", 
            &w, &h, &c) == 3) {
                create_canvas(client, client_pid, w, h, c, output);
                return;
        } else {
            //invalid command format
            sprintf(output, "-1\n");
            return;
        }

    }
    
    if (strstr(cmd, "generate") != NULL) {
        
        uint64_t canvas_id;
        char filename[BUFF];
        size_t start, end, frame_rate;
        if (sscanf(cmd, "generate %lu %s %zu %zu %zu", 
            &canvas_id, filename, &start, &end, &frame_rate) == 5) {
                //int res = generate_canvas(canvas_id, filename, start, end, frame_rate);
                return;
        } else {
            return;
        }

    } 

    sprintf(output, "-1\n");
    return;
    }



void* worker_thread(void* arg){
    while (1){
        pthread_mutex_lock(&task_mutex);
        while (task_head == NULL){
            pthread_cond_wait(&task_cond, &task_mutex);     

        }

            
        client_task_t* task = task_head;
        task_head = task_head->next;

        if (task_head == NULL){
            task_tail = NULL;
        }

        pthread_mutex_unlock(&task_mutex);
        //find the client and get check if ready to process the task
        client_t* client = NULL;
        char output[BUFF] = {0};
        
        for (int i = 0; i < num_clients; i++){
            if (clients[i].client_pid == task->client_pid){
                client = &clients[i];
                break;
            }
        }
        cmd_handler(task->cmd, client, task->client_pid, output);

        if (client != NULL){
            while (1){
                if (task->task_id == client->next_res_id){
                    if ((strstr(output, "0\n") != NULL) && (strstr(task->cmd, "Disconnect") != NULL)){
                        write(task->fd_s2c, output, strlen(output));
                        //wait a minute to make sure the client receive the message before closing
                        usleep(5000);
                        close(client->fd_c2s);
                        close(client->fd_s2c);
                        unlink(client->path_c2s);
                        unlink(client->path_s2c);
                        break;
                    }
                    write(task->fd_s2c, output, strlen(output));
                    client->next_res_id++;
                    break;
                }
                //wait for the previous task to be processed
                usleep(100);
            }
        } else {
            write(task->fd_s2c, "0\n\0", 2);
            
        }

       
        


        free(task);
        }

    return NULL;
        
    }

int main(int argc, char** argv, char** envp) {
    if (argc < 2) {
        fprintf(stderr, "Usage: %s <threadpool size>\n", argv[0]);
        return 1;
    }
    //get server pid
    pid_t pid = getpid();
    printf("Server PID: %d\n", pid);
    fflush(stdout);

    struct canvas* canvas = animate_create_canvas(100,100,0);
    
    pthread_t* threads = malloc(sizeof(pthread_t) * atoi(argv[1]));
    if (threads == NULL){
        //fprintf(stderr, "Failed to allocate memory for threads.\n");
        return 1;
    }

    for (int i = 0; i < atoi(argv[1]); i++){
        pthread_create(&threads[i], NULL, worker_thread, NULL);
    }

    //set up signal handler for SIGUSR1
    struct sigaction sa;
    sa.sa_sigaction = signal_handler;
    sa.sa_flags = SA_SIGINFO;
    sigemptyset(&sa.sa_mask);
    sigaction(SIGUSR1, &sa, NULL);

    //prevent the code end before receiving reply
    while(1){
        //pause();

        if (latest_client_pid != 0 && num_clients < BUFF){

            //after receiving signal back to the program
            char path_c2s[BUFF];
            char path_s2c[BUFF];
            //get the latest client's channel
            sprintf(path_c2s, "FIFO_C2S_%d", latest_client_pid);
            sprintf(path_s2c, "FIFO_S2C_%d", latest_client_pid);

            //delet the FIFO if exist
            unlink(path_c2s);
            unlink(path_s2c);

            mkfifo(path_c2s, 0666);
            mkfifo(path_s2c, 0666);
            kill(latest_client_pid, SIGUSR2);
            

            client_t new_client;
            new_client.client_pid = latest_client_pid;
            new_client.fd_c2s = open(path_c2s, O_RDONLY | O_NONBLOCK);
            new_client.fd_s2c = open(path_s2c, O_WRONLY | O_NONBLOCK);
            new_client.is_logged_in = 0;
            new_client.username[0] = '\0';
            new_client.tasks_num = 0;
            new_client.next_res_id = 1;
            new_client.controlled_canvas[0] = NULL;
            new_client.controlled_canvas_cnt = 0;
            strncpy(new_client.path_c2s, path_c2s, BUFF - 1);
            new_client.path_c2s[BUFF - 1] = '\0';
            strncpy(new_client.path_s2c, path_s2c, BUFF - 1);
            new_client.path_s2c[BUFF - 1] = '\0';
            //reset the latest_client_pid


            clients[num_clients] = new_client;
            num_clients++;
            latest_client_pid = 0;
        }
        
        //create a fd_set to store the fd of all clients
        //use select to monitor the fd

        //if any fd input, fd_set will know, read one by one

        fd_set read_fds;
        FD_ZERO(&read_fds);
        int max_fd = -1;
        for (int i = 0; i < num_clients; i++){
            FD_SET(clients[i].fd_c2s, &read_fds);
            if (clients[i].fd_c2s > max_fd){
                max_fd = clients[i].fd_c2s;
            }
        }

        struct timeval tv = {0, 100}; //set timeout to 100ms

        int waiting = select(max_fd + 1, &read_fds, NULL, NULL, &tv);
        if (waiting > 0){
            char cmd[BUFF] = {0};
            for (int i = 0; i < num_clients; i++){
                if (FD_ISSET(clients[i].fd_c2s, &read_fds)){
                    ssize_t size_read = read(clients[i].fd_c2s, cmd, BUFF - 1);
                    if (size_read > 0){
                        cmd[size_read] = '\0';

                        cmd[strcspn(cmd, "\r\n")] = '\0';


                        client_task_t* new_task = malloc(sizeof(client_task_t));
                        new_task->fd_c2s = clients[i].fd_c2s;
                        new_task->fd_s2c = clients[i].fd_s2c;
                        new_task->client_pid = clients[i].client_pid;
                        strcpy(new_task->cmd, cmd);
                        new_task->next=NULL;
                        clients[i].tasks_num++;
                        new_task->task_id = clients[i].tasks_num;

                        pthread_mutex_lock(&task_mutex);
                        //add the tast into task queue
                        if (task_head == NULL){
                            task_head = new_task;
                            task_tail = new_task;
                        } else {
                            task_tail->next = new_task;
                            task_tail = new_task;
                        }
                        pthread_cond_signal(&task_cond);
                        pthread_mutex_unlock(&task_mutex);
                    } else {
                        pthread_mutex_lock(&task_mutex);
                        //remove the client if read error or client disconnected
                        close(clients[i].fd_c2s);
                        close(clients[i].fd_s2c);

                        for (int j = i; j < num_clients -1 ; j++){
                            clients[j] = clients[j+1];
                        }
                        num_clients--;
                        pthread_mutex_unlock(&task_mutex);
                    }
                }
            }
        }
    }

    animate_destroy_canvas(canvas);
    return 0;
}