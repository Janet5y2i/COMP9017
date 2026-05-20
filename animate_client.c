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

//initialize the flag
volatile sig_atomic_t flag = 0;

//when receiving sigusr2, update flag and open fifo
void signalHandler(int sig, siginfo_t *info, void *ucontext){
    pid_t server_pid = info->si_pid;
    printf("signal received from: %d.\n", server_pid);
    flag = 1;

}


int main(int argc, char** argv, char** envp) {

    pid_t client_pid = getpid();

    //signal(SIGUSR2, signalHandler);

    //start from receiving the server's PID, then send a message to the server to indicate that the client is ready to receive the canvas
    if (argc < 2) {
        fprintf(stderr, "Usage: %s <server_pid>\n", argv[0]);
        return 1;
    }

    pid_t server_pid = atoi(argv[1]);
    //second: send a signal to server(pid = server_pid)
    sigset_t new_mask, old_mask, wait_mask;
    struct sigaction sa;
    //empty the structure
    sigemptyset(&sa.sa_mask);
    sa.sa_flags = SA_SIGINFO;
    sa.sa_sigaction = signalHandler;
    

    sigemptyset(&new_mask);
    sigaddset(&new_mask, SIGUSR2);
    /*add new_mask sig as block list, and save the original
    one to the old_mask set*/
    sigprocmask(SIG_BLOCK, &new_mask, &old_mask);
    sigaction(SIGUSR2, &sa, NULL);

    //first send sigusr1 to server
    kill(server_pid, SIGUSR1);

    //third wait for sigusr2 receving SIDUSR2, execute the handler
    
    sigemptyset(&wait_mask);

    while (flag == 0){
        sigsuspend(&wait_mask);
    }

    //reset the mask
    sigprocmask(SIG_SETMASK, &old_mask, NULL);

     //set FIFO path by id   
    char path_c2s[BUFF];
    char path_s2c[BUFF];
    char req[BUFF];
    char res[BUFF];
    char username[MAXUSERNAME];
    sprintf(path_c2s, "FIFO_C2S_%d", client_pid);
    sprintf(path_s2c, "FIFO_S2C_%d", client_pid);

    //send login message to server, get login cmd from user
    fgets(req, BUFF, stdin);
    //get username from stdin
    sscanf(req, "Login %s\n", username);
    
    //open fifo based on the path
    int fd_c2s = open(path_c2s, O_WRONLY); //write only
    int fd_s2c = open(path_s2c, O_RDONLY); //read only



    write(fd_c2s, req, strlen(req));
    //get auth response

    ssize_t size_read = read(fd_s2c, res, sizeof(res)-1);
    if ( size_read > 0) {
        res[size_read] = '\0';
        if ((strstr(res, "Reject") != NULL)){
            printf("%s\n", res);
            close(fd_c2s);
            close(fd_s2c);
            unlink(path_c2s);
            unlink(path_s2c);
        } else {
            res[strcspn(res, "\r\n")] = 0;
            printf("Welcome %s. Your balance is %s.\n", username, res);
            fflush(stdout);
            
            while(1){
                char cmd_buf[BUFF];
                if (fgets(cmd_buf, BUFF, stdin) == NULL) break;
                write(fd_c2s, cmd_buf, strlen(cmd_buf));
                char res_buf[BUFF];
                ssize_t res_size = read(fd_s2c, res_buf, sizeof(res_buf)-1);
                char res_value[BUFF] = {0};

                if (res_size > 0){
                    res_buf[res_size] = '\0';
                    if (strcmp(res_buf, "0\n") == 0 && strstr(cmd_buf, "Disconnect") != NULL) {
                        break; 
                    }

                    if (strcmp(res_buf, "-1\n") == 0){
                        printf("RPC Failed\n");
                    }
                    if (strcmp(res_buf, "-2\n") == 0){
                        printf("Value error\n");
                    }
                    if (strcmp(res_buf, "-3\n") == 0){
                        printf("Internal error\n");
                    }
                    if (strcmp(res_buf, "0\n") == 0){
                        printf("Success\n");
                    }
                    if (strncmp(res_buf, "0 ", 2) == 0){
                        sscanf(res_buf, "0 %s", res_value);
                        printf("Success %s\n", res_value);
                    }

                    

                    fflush(stdout);

                } else {
                    break;
                }
                }
            }
        }
    close(fd_c2s);
    close(fd_s2c);
    unlink(path_c2s);
    unlink(path_s2c);
    return 0;
}
