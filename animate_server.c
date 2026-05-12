
#include "animate/animate.h"
#include <unistd.h>
#include <stdio.h>
#include <signal.h>
#include <errno.h>
#include <sys/stat.h>
#include <sys/types.h>

#define BUFF 1024

void signalHandler(int sig, siginfo_t *info, void *ucontext){
    pid_t client_pid = info->si_pid;
    printf("Signal received from: %d.\n", client_pid);
    char path_c2s[BUFF];
    char path_s2c[BUFF];
    //set FIFO path by id
    sprintf(path_c2s, "FIFO_C2S_%d", client_pid);
    sprintf(path_s2c, "FIFO_S2C_%d", client_pid);

    int res_c2s = mkfifo(path_c2s, 0666);
    int res_s2c = mkfifo(path_s2c, 0666);

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
    //make FIFO

    kill(client_pid, SIGUSR2);

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

    //third: after receiving the signal from the client
    struct sigaction sa;
    sigemptyset(&sa.sa_mask);
    sa.sa_flags = SA_SIGINFO;
    sa.sa_sigaction = signalHandler;


    //receiving sigusr1 from client,  send FIFO and sigusrs to client
    sigaction(SIGUSR1, &sa, NULL);
    

    //prevent the code end before receiving reply
    char req[BUFF];
    while(1){
        if (read(res_s2c,req,sizeof(req)) != NULL){
            
        }
        pause();
    }

    animate_destroy_canvas(canvas);
    
    return 0;
}
