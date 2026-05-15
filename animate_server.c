
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
    char username[MAXUSERNAME];
    int is_logged_in;
} client_t;

//record the clients info
client_t clients[BUFF];
int num_clients = 0;

//RPC task struct
typedef struct client_task {
    char cmd[BUFF];
    int fd_c2s;
    int fd_s2c;
    struct client_task* next;
} client_task_t;

client_task_t* task_head = NULL;
client_task_t* task_tail = NULL;

void signal_handler(int sig, siginfo_t *info, void *ucontext){
    latest_client_pid = info->si_pid;
}

int authorisation (const char *username){
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


void cmd_handler(char* cmd, int fd_c2s, int fd_s2c){
    char res_cmd[BUFF];

    if (strstr(cmd, "Login") != NULL) {
        char username[MAXUSERNAME];
        sscanf(cmd, "Login %s", username);
        int res = authorisation(username);
        if (res >= 0){
            sprintf(res_cmd, "%d\n", res);
            write(fd_s2c, res_cmd, strlen(res_cmd));
        } else {
            if (res == -2){
                strcpy(res_cmd,"Reject BALANCE\n");
            } else {
                strcpy(res_cmd,"Reject UNAUTHORISED\n");
            }
            write(fd_s2c, res_cmd, strlen(res_cmd));
        }
    } 
    
    if (strstr(cmd, "Disconnect") != NULL){
        write(fd_s2c, "0\0", 2);
    } 
        //other cmd
    }



void* worker_thread(void* arg){
    while (1){
        pthread_mutex_lock(&task_mutex);
        if (task_head == NULL){
            pthread_cond_wait(&task_cond, &task_mutex);     

        }
            
        client_task_t* task = task_head;
        task_head = task_head->next;

        if (task_head == NULL){
            task_tail = NULL;
        }


        pthread_mutex_unlock(&task_mutex);

        cmd_handler(task->cmd, task->fd_c2s, task->fd_s2c);
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
    printf("Server PID: %d.\n", pid);

    struct canvas* canvas = animate_create_canvas(100,100,0);
    
    pthread_t* threads = malloc(sizeof(pthread_t) * atoi(argv[1]));
    if (threads == NULL){
        fprintf(stderr, "Failed to allocate memory for threads.\n");
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
            new_client.fd_s2c = open(path_s2c, O_WRONLY);
            new_client.is_logged_in = 0;
            new_client.username[0] = '\0';
            clients[num_clients] = new_client;
            num_clients++;
            //reset the latest_client_pid
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

                        if (strstr(cmd, "Disconnect") != NULL){
                        }

                        client_task_t* new_task = malloc(sizeof(client_task_t));
                        new_task->fd_c2s = clients[i].fd_c2s;
                        new_task->fd_s2c = clients[i].fd_s2c;
                        strcpy(new_task->cmd, cmd);
                        new_task->next=NULL;

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
                    }
                }
            }
        }
    }

    animate_destroy_canvas(canvas);
    return 0;
}

