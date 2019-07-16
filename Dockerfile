FROM tensorflow/tensorflow:1.12.0

### set up environment ###
ENV GOROOT /usr/local/go
ENV GOPATH /go
ENV PATH $PATH:$GOROOT/bin
ENV TARGET_TF_DIR /usr/local

### golang env ###
ENV GOLANG_VERSION 1.12
ENV GOLANG_PK go$GOLANG_VERSION.linux-amd64.tar.gz
ENV GOLANG_PK_URL https://dl.google.com/go/$GOLANG_PK
ENV GO111MODULE on

### tensorflow env ###
ENV TENSORFLOW_VER 1.14.0
ENV TENSORFLOW_C_LIB libtensorflow-cpu-linux-x86_64-$TENSORFLOW_VER.tar.gz
ENV TENSORFLOW_LIB_URL https://storage.googleapis.com/tensorflow/libtensorflow/$TENSORFLOW_C_LIB

### /etc/apt/sources.list ###
ENV JP_URL  http://jp.archive.ubuntu.com/ubuntu/
RUN echo "\
    deb $JP_URL xenial main restricted \n\
    # deb-src $JP_URL xenial main restricted \n\
    deb $JP_URL xenial-updates main restricted \n\
    # deb-src $JP_URL xenial-updates main restricted \n\
    deb $JP_URL xenial universe \n\
    # deb-src $JP_URL xenial universe \n\
    deb $JP_URL xenial-updates universe \n\
    # deb-src $JP_URL xenial-updates universe \n\
    deb $JP_URL xenial multiverse \n\
    # deb-src $JP_URL xenial multiverse \n\
    deb $JP_URL xenial-updates multiverse \n\
    # deb-src $JP_URL xenial-updates multiverse \n\
    deb $JP_URL xenial-backports main restricted universe multiverse \n\
    # deb-src $JP_URL xenial-backports main restricted universe multiverse \n\
    # deb http://archive.canonical.com/ubuntu xenial partner \n\
    # deb-src http://archive.canonical.com/ubuntu xenial partner \n\
    deb http://security.ubuntu.com/ubuntu/ xenial-security main restricted \n\
    # deb-src http://security.ubuntu.com/ubuntu/ xenial-security main restricted \n\
    deb http://security.ubuntu.com/ubuntu/ xenial-security universe \n\
    # deb-src http://security.ubuntu.com/ubuntu/ xenial-security universe \n\
    deb http://security.ubuntu.com/ubuntu/ xenial-security multiverse \n\
    # deb-src http://security.ubuntu.com/ubuntu/ xenial-security multiverse \n\
    " > /etc/apt/sources.list
RUN apt-get update

### work dir ###
WORKDIR $GOPATH/src/github.com/TakenokoTech/go-voice
ADD ./go.mod $GOPATH/src/github.com/TakenokoTech/go-voice/go.mod
ADD ./go.sum $GOPATH/src/github.com/TakenokoTech/go-voice/go.sum
# ADD  .  $GOPATH/src/github.com/TakenokoTech/go-voice

### install essential ###
RUN apt-get install -y build-essential wget

### install golang and tensorflow ###
RUN cd $GOPATH && wget $GOLANG_PK_URL && tar -xvf $GOLANG_PK && mv go $TARGET_TF_DIR
RUN cd $GOPATH && wget $TENSORFLOW_LIB_URL && tar -xvf $TENSORFLOW_C_LIB -C $TARGET_TF_DIR

### apt-get ###
RUN apt-get install -y git

### go run ###
RUN go get
CMD go run main.go

EXPOSE 8080