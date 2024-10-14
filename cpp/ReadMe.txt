This directory contains code taken from the original SearchSecoControler
(written in C++).  It computes a numeric identifier from the url of a github
repository.

Usage:
  seseco_pid1 <url>
Prints the numeric id on stdout (and returns value 0) on success
else prints nothing and returns a positive value.

The resulting program is currently used ad a child process in the crawler.
It should be found by exec.  You should put it in a directory on the PATH.
