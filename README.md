Phoenix v1
==========

![phoenix](phoenix.png) **It's distributed!**

Social feeds without ads or owners. Be free!

Phoenix is a peer-to-peer network. It uses crytographic keypairs to create feeds and publish unforgeable entries which can spread across the network (see [secure-scuttlebutt](https://github.com/dominictarr/secure-scuttlebutt)). Relay servers optionally aggregate and redistribute the feeds.

Join us in #scuttlebutt on freenode.

## Getting Started

**To start on your localhost**

```
git clone https://github.com/pfraze/phoenix.git
cd phoenix
npm install
./phoenix setup
./phoenix serve
```

The home server runs a private instance on `localhost:65000`.

**To setup a relay**

```
git clone https://github.com/pfraze/phoenix.git
cd phoenix
npm install
./phoenix setup
sudo ./phoenix serve -p -d
```

This will start the home server on 65000 and the pub server on port 80 (`-p`). The `-d` will put the server in daemon mode.

To stop it, run:

```
./phoenix stop
```

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