#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>
#include <signal.h>
#include <fcntl.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <string.h>

#define BUFF 1024


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

    sprintf(path_c2s, "FIFO_C2S_%d", client_pid);
    sprintf(path_s2c, "FIFO_S2C_%d", client_pid);

    //open fifo
    int fd_c2s = open(path_c2s, O_WRONLY); //write only
    int fd_s2c = open(path_s2c, O_RDONLY); //read only

    //send login message to server
    char req[BUFF];
    fgets(req, BUFF, stdin);

    if (strstr(req, "Login") != NULL){
        write(fd_c2s, req, strlen(req));
    }
    waipid(server_pid);

    char res[BUFF];

    read(fd_s2c, res, sizeof(res)-1);
    if (res == "Reject BALANCE\n"){
        printf("%c", res);
    } else if (res == "Reject UNAUTHORISED\n"){
        printf("%c", res);
    } else {
        printf("Welcome %c. Your balance is %c\n", res);
    }
    return 0;
}
