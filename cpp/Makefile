CIBLE = main
SRCS =  Main.cpp
OPENGL_PATH = /usr/lib/x86_64-linux-gnu/ # change this for your own environment
LIBS = -L$(OPENGL_PATH) -lglut -lGLU -lGL -lGLEW -lm -lpthread

#
# Nom du programme
#
PROG = main

CC = g++
CPP = g++

FLAGS = -Wall -g -pthread -std=c++11

CFLAGS = $(FLAGS)
CXXFLAGS = $(FLAGS)

OBJS = $(SRCS:.cpp=.o)

$(CIBLE): $(OBJS)
	g++ $(LDFLAGS) -o $(CIBLE) $(OBJS) $(LIBS)
clean:
	rm -f  *~  $(CIBLE) $(OBJS)
run: ${PROG}
	./${PROG}

Main.o: Main.cpp
