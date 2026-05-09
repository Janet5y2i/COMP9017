
#include "animate/animate.h"
#include <unistd.h>
#include <stdio.h>
#include <signal.h>


void signalHandler(int sig, siginfo_t *info, void *ucontext){
    pid_t client_pid = info->si_pid;
    printf("Signal received from: %d.\n", client_pid);
    kill(client_pid, SIGUSR2);
}

int main(int argc, char** argv, char** envp) {
    if (argc < 2) {
        fprintf(stderr, "Usage: %s <port>\n", argv[0]);
        return 1;
    }

    //get server pid
    pid_t pid = getpid();
    printf("Server PID: %d.\n", pid);

    //after receiving the signal from the client
    struct sigaction sa = {.sa_flags = SA_SIGINFO, .sa_sigaction = signalHandler};
    sigaction(SIGUSR1, &sa, NULL);
    pause();


    struct canvas* canvas = animate_create_canvas(100,100,0);
    animate_destroy_canvas(canvas);
    
    return 0;
}
