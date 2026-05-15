#include "animate/animate.h"
#include <unistd.h>
#include <stdio.h>
#include <signal.h>
#include <errno.h>
#include <fcntl.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <string.h>

#define BUFF 1024
#define MAXUSERNAME 32

typedef struct  {
    pid_t client_pid;
    int fd_c2s;
    int fd_s2c;
    char username[MAXUSERNAME];
    int is_logged_in;
    sturct 
} client_info_t;

typedef struct rpc_task {
    char cmd[BUFF];
    int client_fd_s2c;
    struct rpc_task* next_task;
} rpc_task_t;

rpc_task_t* task_q_head = NULL;
pthread_mutex_t task_q_mutex = PTHREAD_MUTEX_INITIALIZER;
pthread_cond_t task_q_cond = PTHREAD_COND_INITIALIZER;

int threadpool_size;

volatile sig_atomic_t latest_client_pid = 0;

void signalHandler(int sig, siginfo_t *info, void *ucontext){
    latest_client_pid = info->si_pid;
    printf("Signal received from: %d.\n", latest_client_pid);
    char path_c2s[BUFF];
    char path_s2c[BUFF];
    //set FIFO path by id
    sprintf(path_s2c, "FIFO_S2C_%d", latest_client_pid);
    sprintf(path_c2s, "FIFO_C2S_%d", latest_client_pid);
    

    unlink(path_c2s);
    unlink(path_s2c);
    int res_c2s = mkfifo(path_c2s, 0666);
    int res_s2c = mkfifo(path_s2c, 0666);
    kill(latest_client_pid, SIGUSR2);
    //remove the exist one if exist
    if (res_c2s == -1){
        if (errno == EEXIST){
            unlink(path_c2s);
            mkfifo(path_c2s, 0666);
        } else {
            perror("mkfifo");
        }
    }


    if (res_s2c == -1){
        if (errno == EEXIST){
            unlink(path_s2c);
            mkfifo(path_s2c, 0666);
        } else {
            perror("mkfifo");
        }
    }

    client_info_t* client
    //passing the siqusr2 to client


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

//handle the command from client
void command_handler(struct rpc_task_t* task){
    char res_msg[BUFF];

    char store_cmd = strtok(cmd, " \n");
    if (store_cmd == NULL) return;



}

void work_thread(){
    while (1){
        pthread_mutex_lock(&task_q_mutex);
        while (task_q_head == NULL {
            pthread_cond_wait(&task_q_cond, &task_q_mutex);
        })
    }

    //get the task from the head of the queue
    rpc_task_t* task = task_q_head;
    queue_head = queue_head->next_task;
    //unlock the mutex
    pthread_mutex_unlock(&task_q_mutex);
    //execute the task
    handle_command(task);
}

int main(int argc, char** argv, char** envp) {
    if (argc < 2) {
        fprintf(stderr, "Usage: %s <threadpool size>\n", argv[0]);
        return 1;
    }


    //create the canvas
    struct canvas* canvas = animate_create_canvas(100,100,0);

    //get server pid
    pid_t pid = getpid();
    printf("Server PID: %d.\n", pid);

    //initialize the thread pool
    threadpool_size = atoi(argv[1]);
    pthread_t *threads = malloc(sizeof(pthread_t) * threadpool_size);
    if  (threads == NULL){
        perror("malloc");
        return 1;
    }

    //starting the thread pool
    for (int i = 0; i < threadpool_size; i++){
        pthread_create(&threads[i], NULL, work_thread, NULL);
    }


    //third: after receiving the signal from the client
    struct sigaction sa = {0};
    //sigemptyset(&sa.sa_mask);
    sa.sa_flags = SA_SIGINFO;
    sa.sa_sigaction = signalHandler;

    //receiving sigusr1 from client,  send FIFO and sigusrs to client
    sigaction(SIGUSR1, &sa, NULL);
    

    //prevent the code end before receiving reply
    while(1){
        pause();

        //after receiving signal back to the program
        char path_c2s[BUFF];
        char path_s2c[BUFF];
        
        //get the latest client's channel
        sprintf(path_c2s, "FIFO_C2S_%d", latest_client_pid);
        sprintf(path_s2c, "FIFO_S2C_%d", latest_client_pid);
        
        int fd_c2s = open(path_c2s, O_RDONLY); //read only
        int fd_s2c = open(path_s2c, O_WRONLY); //write only
        
        char req[BUFF];
        //read the message: ssize_t can be -1
        //sizeof(req)-1 not include the last \0
        ssize_t size_read = read(fd_c2s, req, sizeof(req)-1);

        if (size_read > 0){
            req[size_read] = '\0';
            char username[MAXUSERNAME];
            //get username
            if (sscanf(req, "Login %s", username) == 1){
                //get balance or reject reson from authorisation function
                int res = authorisation(username);
                //set response msq
                char res_msg[BUFF];
                if (res >= 0) {
                    sprintf(res_msg, "%d\n", res);
                    write(fd_s2c, res_msg, strlen(res_msg));

                    //start RPC if user exit and balance > 0
                    while (1){
                        char cmd_buf[BUFF];
                        ssize_t cmd_size = read(fd_c2s, cmd_buf, sizeof(cmd_buf)-1);
                        if (cmd_size < 0){
                            break;
                        } else {
                            cmd_buf[cmd_size] = '\0';
                            if (strstr(cmd_buf, "Disconnect") != NULL){
                                write(fd_s2c, "0\0", 2);
                            }
                            command_handler();
                        }
                        
                    }


                    
                } else {
                    if (res == -2){
                        strcpy(res_msg,"Reject BALANCE\n");
                    } else {
                        strcpy(res_msg,"Reject UNAUTHORISED\n");
                    }
                    write(fd_s2c, res_msg, strlen(res_msg));
                    sleep(1);
                    unlink(path_c2s);
                    unlink(path_s2c);
                }
            }
        }
        unlink(path_c2s);
        unlink(path_s2c);
        close(fd_c2s);
        close(fd_s2c);
/*
    animate_destroy_canvas(canvas);
    */
    }
    return 0;
    
}
