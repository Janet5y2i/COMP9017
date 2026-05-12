#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>
#include <signal.h>
#include <fcntl.h>

#define BUFF 1024


//initialize the flag
volatile sig_atomic_t flag = 0;

//when receiving sigusr2, update flag and open fifo
void signalHandler(int sig, siginfo_t *info, void *ucontext){
    pid_t server_pid = info->si_pid;
    pid_t client_pid = getpid();
    printf("signal received from: %d.\n", server_pid);
    flag = 1;

     //set FIFO path by id   
    char path_c2s[BUFF];
    char path_s2c[BUFF];

    sprintf(path_c2s, "FIFO_C2S_%d", client_pid);
    sprintf(path_s2c, "FIFO_S2C_%d", client_pid);

    //open fifo
    int fd_c2s = open(path_c2s, O_WRONLY);
    int fd_s2c = open(path_s2c, O_RDONLY);

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

    sigprocmask(SIG_SETMASK, &old_mask, NULL);

    return 0;
}
