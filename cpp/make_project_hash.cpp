#include <string>
#include "md5.h"

using std::string;


// name should be the name of the repository (last part of the url)
// author should be the owner of the repository (part of the url before the name)
// url should be the full url of the repository
//   or actually the field html_url from the metadata of the repository
long long project_id(string const &name, string const &author, string const &url) {
	string id = name+author+url;
        string md5hash = md5(id);

        long long hash = 0;
        for (int i = 0; i < 16; i++) {
                int num = 0;
                switch (md5hash[i])
                {
                case 'a':
                        num = 10;
                        break;
                case 'b':
                        num = 11;
                        break;
                case 'c':
                        num = 12;
                        break;
                case 'd':
                        num = 13;
                        break;
                case 'e':
                        num = 14;
                        break;
                case 'f':
                        num = 15;
                        break;
                default:
                        num = std::stoi(std::string(1, md5hash[i]));
                }
                hash += num << (i * 4);
        }
        if (hash < 0) {
                hash = -hash;
        }
        return hash;
}
/*
int main(int argc, char **argv) {
	if (argc<4) return 1;
	long long pid = project_id(argv[1], argv[2], argv[3]);
	printf("%llx\n", pid);
	printf("%lld\n", pid);
}
*/
int main(int argc, char **argv) {
	if (argc<2) return 1;
	string url = argv[1];
	int pos1 = url.rfind('/');
	if (pos1<=0) return 2;
	int pos2 = url.rfind('/', pos1-1);
	if (pos2<0) return 2;
	string name = url.substr(pos1+1);
	string author = url.substr(pos2+1, pos1-pos2-1);

	long long pid = project_id(name, author, url);
	//printf("%llx\n", pid);
	printf("%lld\n", pid);
}
