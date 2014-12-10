Phoenix v1
==========

![phoenix](phoenix.png) **It's distributed!**

Web applications without servers, social networks without advertisers, messaging without surveillance, and gardens without walls.

Phoenix is a peer-to-peer network. It uses crytographic keypairs to create feeds and publish unforgeable entries which can spread across the network (see [secure-scuttlebutt](https://github.com/dominictarr/secure-scuttlebutt)). Public bot users aggregate and redistribute the feeds, but phoenix has no "servers." Every node is equal, and the network is fully open!

Join us in #scuttlebutt on freenode.

## Getting Started

**To start on your localhost**

Follow the instructions for using [ssbui](https://github.com/pfraze/ssbui#readme).

## Contributing

Contributions are welcome! The fastest way to get started is to check the issues board. Issues tagged "Help Wanted" are the low-hanging fruit and should be easy to handle. Submit your update as a PR; maintainers will review and merge asap.

Make sure your submissions are licensed for free use. All code in Phoenix (including contributions) falls under the license below, or under the licenses attached to included libraries.

You can get help in #scuttlebutt on freenode.

## Project Repos

The phoenix project is broken into four main repositories:

 - [secure-scuttlebutt](https://github.com/dominictarr/secure-scuttlebutt): a library on top of leveldb that adds the data structures, crypto, and indexing of the ssb protocol.
 - [scuttlebot](https://github.com/pfraze/scuttlebot): a network server & server-library which wraps ssb
 - [muxrpc](https://github.com/dominictarr/muxrpc): the RPC protocol used by scuttlebot and phoenix
 - [phoenix](https://github.com/pfraze/phoenix): a social-feeds plugin to scuttlebot
 - [ssbui](https://github.com/pfraze/ssbui): an installable package for using phoenix with scuttlebot

## License

Copyright (c) 2014 Dominic Tarr and Paul Frazee

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.