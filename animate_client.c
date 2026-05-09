#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>


int main(int argc, char** argv, char** envp) {

    //start from receiving the server's PID, then send a message to the server to indicate that the client is ready to receive the canvas
    if (argc < 2) {
        fprintf(stderr, "Usage: %s <server_pid>\n", argv[0]);
        return 1;
    }

    pid_t server_pid = atoi(argv[1]);
    //send aa signal to server(pid = server_pid)
    Kill(server_pid, SIGUSR1);



    return 0;
}
