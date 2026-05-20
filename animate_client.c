#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <signal.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>

#define FIFONAME 64
#define USERNAME 32
#define BUFF 1024


void sigHandler(int sig, siginfo_t *info, void *ucontext){
    pid_t server_pid = info->si_pid;
    printf("signal received from: %d.\n", server_pid);
}


int main(int argc, char** argv) {
    if (argc < 2) {
        fprintf(stderr, "Usage: %s <server pid>\n", argv[0]);
        return 1;
    }

    pid_t server_pid = atoi(argv[1]);
    pid_t client_pid = getpid();

    sigset_t new_mask, wait_mask, old_mask;
    struct sigaction sa;
    sa.sa_sigaction = sigHandler;
    sigemptyset(&sa.sa_mask);
    sa.sa_flags = SA_SIGINFO;
    sigaction(SIGUSR2, &sa, NULL);


    sigemptyset(&new_mask);
    sigaddset(&new_mask, SIGUSR2);
    sigprocmask(SIG_BLOCK, &wait_mask, &old_mask);

    //send sigusr1 to server
    kill(server_pid, SIGUSR1);

    sigemptyset(&wait_mask);
    sigsuspend(&wait_mask);

    sigprocmask(SIG_SETMASK, &old_mask, NULL);

     //set FIFO path by id
    char path_c2s[FIFONAME];
    char path_s2c[FIFONAME];
    sprintf(path_c2s, "FIFO_C2S_%d", client_pid);
    sprintf(path_s2c, "FIFO_S2C_%d", client_pid);

    int fd_c2s = open(path_c2s, O_WRONLY);
    int fd_s2c = open(path_s2c, O_RDONLY);





    //wait for sigusr2
    while(1){

    }
}