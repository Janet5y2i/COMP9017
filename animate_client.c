#include <unistd.h>
#include <stdio.h>
#include <stdlib.h>
#include <signal.h>
#include <errno.h>
#include <fcntl.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <string.h>
#include <pthread.h>

#define BUFF 1024
#define MAXUSERNAME 32

volatile sig_atomic_t flag = 0;

void signalHandler(int sig, siginfo_t *info, void *ucontext){
    (void)sig; (void)ucontext; (void)info;
    flag = 1;
}

int main(int argc, char** argv, char** envp) {
    (void)envp;
    pid_t client_pid = getpid();

    if (argc < 2) {
        fprintf(stderr, "Usage: %s <server_pid>\n", argv[0]);
        return 1;
    }

    pid_t server_pid = atoi(argv[1]);
    sigset_t new_mask, old_mask, wait_mask;
    struct sigaction sa;
    sigemptyset(&sa.sa_mask);
    sa.sa_flags = SA_SIGINFO;
    sa.sa_sigaction = signalHandler;
    
    sigemptyset(&new_mask);
    sigaddset(&new_mask, SIGUSR2);
    sigprocmask(SIG_BLOCK, &new_mask, &old_mask);
    sigaction(SIGUSR2, &sa, NULL);

    kill(server_pid, SIGUSR1);
    
    sigemptyset(&wait_mask);
    while (flag == 0){
        sigsuspend(&wait_mask);
    }
    sigprocmask(SIG_SETMASK, &old_mask, NULL);

    char path_c2s[BUFF], path_s2c[BUFF], req[BUFF], res[BUFF], username[MAXUSERNAME];
    sprintf(path_c2s, "FIFO_C2S_%d", client_pid);
    sprintf(path_s2c, "FIFO_S2C_%d", client_pid);

    if (fgets(req, BUFF, stdin) == NULL) return 0;
    sscanf(req, "Login %s\n", username);
    
    int fd_c2s = open(path_c2s, O_WRONLY);
    int fd_s2c = open(path_s2c, O_RDONLY);

    write(fd_c2s, req, strlen(req));

    ssize_t size_read = read(fd_s2c, res, sizeof(res)-1);
    if (size_read > 0) {
        res[size_read] = '\0';
        if (strstr(res, "Reject") != NULL){
            printf("%s", res);
            fflush(stdout);
        } else {
            res[strcspn(res, "\r\n")] = 0;
            printf("Welcome %s. Your balance is %s.\n", username, res);
            fflush(stdout);
            
            while(1){
                char cmd_buf[BUFF];
                if (fgets(cmd_buf, BUFF, stdin) == NULL) break;
                
                write(fd_c2s, cmd_buf, strlen(cmd_buf));
                
                char res_buf[BUFF];
                ssize_t res_size = read(fd_s2c, res_buf, sizeof(res_buf)-1);
                char res_value[BUFF] = {0};

                if (res_size > 0){
                    res_buf[res_size] = '\0';
                    
                    // 健壯性：包含 Disconnected 就直接安全 break 退出進程
                    if (strcmp(res_buf, "0\n") == 0 && strstr(cmd_buf, "Disconnect") != NULL) {
                        printf("Success\n");
                        fflush(stdout);
                        break; 
                    }

                    if (strcmp(res_buf, "-1\n") == 0) printf("RPC Failed\n");
                    else if (strcmp(res_buf, "-2\n") == 0) printf("Value error\n");
                    else if (strcmp(res_buf, "-3\n") == 0) printf("Internal error\n");
                    else if (strcmp(res_buf, "0\n") == 0)  printf("Success\n");
                    else if (strncmp(res_buf, "0 ", 2) == 0){
                        sscanf(res_buf, "0 %s", res_value);
                        printf("Success %s\n", res_value);
                    }
                    fflush(stdout);
                } else {
                    // 管道被 Server 端切斷，Client 必須立刻退出，防止卡死在後台
                    break;
                }
            }
        }
    }
    close(fd_c2s);
    close(fd_s2c);
    unlink(path_c2s);
    unlink(path_s2c);
    return 0;
}