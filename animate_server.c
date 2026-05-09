
#include "animate/animate.h"
#include <unistd.h>
#include <stdio.h>

int main(int argc, char** argv, char** envp) {
    if (argc < 2) {
        fprintf(stderr, "Usage: %s <port>\n", argv[0]);
        return 1;
    }
    
    pid_t pid = getpid();
    printf("Server PID: %d.\n", pid);
    struct canvas* canvas = animate_create_canvas(100,100,0);
    animate_destroy_canvas(canvas);
    
    return 0;
}
