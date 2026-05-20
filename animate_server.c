#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <signal.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <ctype.h>
#include "animate/animate.h"

#define FIFONAME 64
#define USERNAME 32
#define BUFF 1024

void sigHandler(int sig, siginfo_t* siginfo, void* context) {
    pid_t client_pid = siginfo->si_pid;
    char path_c2s[FIFONAME];
    char path_s2c[FIFONAME];

    sprintf(path_c2s, "FIFO_C2S_%d", client_pid);
    sprintf(path_s2c, "FIFO_S2C_%d", client_pid);

    unlink(path_c2s);
    unlink(path_s2c);

    mkfifo(path_c2s, 0666);
    mkfifo(path_s2c, 0666);

    kill(client_pid, SIGUSR2);
}


int main(int argc, char* argv[]) {
    if (argc < 2) {
        fprintf(stderr, "Usage: %s <threadpool size>\n", argv[0]);
        return 1;
    }

    //get server PID
    pid_t server_pid = getpid();
    printf("Server PID: %d\n", server_pid);
    //print immediately
    fflush(stdout);

    struct sigaction sa;
    sa.sa_sigaction = sigHandler;
    sa.sa_flags = SA_SIGINFO; //get clinet PID
    sigaction(SIGUSR1, &sa, NULL);

    while (1) {
        pause();
    }

    return 0;
}