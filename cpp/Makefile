seseco_pid1 : make_project_hash.o md5.o
	g++ $^ -o seseco_pid1

${HOME}/bin:
	mkdir ${HOME}/bin

${HOME}/bin/seseco_pid1: seseco_pid1 ${HOME}/bin
	install seseco_pid1 ${HOME}/bin

install: ${HOME}/bin/seseco_pid1
