#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>
#include <signal.h>

volatile sig_atomic_t flag = 0;
void signalHandler(int sig, siginfo_t *info, void *ucontext){
    pid_t server_pid = info->si_pid;
    printf("signal received from: %d.\n", server_pid);
    flag = 1;

}


int main(iœnt argc, char** argv, char** envp) {

    pid_t client_pid = getpid();

    signal(SIGUSR2, signalHandler);

    //start from receiving the server's PID, then send a message to the server to indicate that the client is ready to receive the canvas
    if (argc < 2) {
        fprintf(stderr, "Usage: %s <server_pid>\n", argv[0]);
        return 1;
    }

    pid_t server_pid = atoi(argv[1]);
    //send a signal to server(pid = server_pid)
    kill(server_pid, SIGUSR1);


    struct sigaction sa = {.sa_flags = SA_SIGINFO, .sa_sigaction = signalHandler};
    sigset_t new_mask, old_mask, wait_mask;
    //empty the structure
    sigemptyset(&sa.sa_mask);

    sigaction(SIGUSR2, &sa, NULL);

/*
    if (sigaction(SIGUSR2, &sa, NULL) == -1) {
        perror("sigaction");
        return 1;
    };

    // initialize signalset
    sigemptyset(&new_mask);
    sigaddset(&new_mask, SIGUSR2);

    // block sigusr2
    if (sigprocmask(SIG_BLOCK, &new_mask, &old_mask) == -1){
        perror("sigprocmask");
        return 1;
    }

    // initialize waiting signal set
    sigemptyset(&wait_mask);
    printf("Waiting for SIGUSR2...\n");

    while(!flag){
        if (sigsuspend(&wait_mask) != -1){
            perror("sigsuspend");
            return 1;
        }
    }

    if (sigprocmask(SIG_SETMASK, &old_mask, NULL) == -1) {
        perror("sigprocmask");
        return 1;
    }

    printf("Exiting...\n");
*/

    return 0;
}
