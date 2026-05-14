
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

volatile sig_atomic_t latest_client_pid = 0;

void signalHandler(int sig, siginfo_t *info, void *ucontext){
    latest_client_pid = info->si_pid;
    printf("Signal received from: %d.\n", latest_client_pid);
    char path_c2s[BUFF];
    char path_s2c[BUFF];
    //set FIFO path by id
    sprintf(path_c2s, "FIFO_C2S_%d", latest_client_pid);
    sprintf(path_s2c, "FIFO_S2C_%d", latest_client_pid);

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
    //passing the siqusr2 to client

    kill(latest_client_pid, SIGUSR2);
}

int authorisation (char filename[], char cmd[BUFF]){
    FILE *fptr;
    char buffer[BUFF];
    char input[BUFF];

    strcpy(input, cmd);

    fptr = fopen(filename, "r");

    if (fptr == NULL){
        perror("fopen");
        return 0;
    }

    //read and compare the user line by line
    //save the login user name from input
    char loginName[MAXUSERNAME];
    sscanf(input, "%*s %s", loginName);
    
    //save the userName & balance from file
    char userName[MAXUSERNAME];
    int balance;

    while (fscanf(fptr, "%s %d", userName, &balance) != EOF){
        if (strcmp(loginName, userName) == 0){
            if (balance > 0){
                printf("Welcome %s. Your balance is %d\n", userName, balance);
                return balance;
            } else if (balance <= 0) {
                //printf("Reject BALANCE\n");
                return 0;
            } 
        } 
    }

    //printf("Reject UNAUTHORISED\n");
    return -1;
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
        pause();

        //after receiving signal back to the program
        char path_c2s[BUFF];
        char path_s2c[BUFF];
        char req[BUFF];
        //get the latest client's channel
        sprintf(path_c2s, "FIFO_C2S_%d", latest_client_pid);
        int fd_c2s = open(path_c2s, O_RDONLY); //read only
        int fd_s2c = open(path_s2c, O_WRONLY); //write only

        //read the message: ssize_t can be -1
        //sizeof(req)-1 not include the last \0
        ssize_t size_read = read(fd_c2s, req, sizeof(req)-1);
        char fileName[] = "users.txt";
        char res[BUFF];
        int auth;
        char rejectBalance[] = "Reject BALANCE\n";
        char rejectAuth[] = "Reject UNAUTHORISED\n";

        if(size_read > 0){
            //read the users.txt compare and get ballence
            auth = authorisation(fileName, req);
        } else {
            printf("Error");
            return 0;
        }

        if (auth > 0){
            //printf("Login Successfully");
            sprintf(res, "%d\n", auth);
            write(fd_s2c, res, strlen(res));
        } else if (auth == 0) {
            write(fd_s2c, rejectBalance, strlen(rejectBalance));
            sleep(1);
            close(fd_c2s);
            close(fd_s2c);
            unlink(path_c2s);
            unlink(path_s2c);
        } else {
            write(fd_s2c, rejectAuth, strlen(rejectAuth));
            sleep(1);
            close(fd_c2s);
            close(fd_s2c);
            unlink(path_c2s);
            unlink(path_s2c);
        }

    }

    animate_destroy_canvas(canvas);
    
    return 0;
}
