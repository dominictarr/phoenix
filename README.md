Phoenix v1
==========

![phoenix](phoenix.png) **It's distributed!**

Phoenix is the web UI for [scuttlebot](https://github.com/ssbc/scuttlebot) and part of the [secure-scuttlebutt](https://github.com/ssbc/secure-scuttlebutt) decentralized network. Secure Scuttlebutt (SSB) is a fully-decentralized data network designed to replace Web services. It uses cryptographic keypairs to gossip unforgeable data-feeds across the network. "Pub" servers aggregate and redistribute the feeds, but SSB has no central authority: every node is equal, and the network is fully open.

Join us in #scuttlebutt on freenode.

## Getting Started

Follow the instructions for using [scuttlebot](https://github.com/ssbc/scuttlebot). Phoenix comes packaged with scuttlebot by default.

## Building

To build phoenix, run `npm run build`. If you're doing active development, run `sbot server` with the `--dev` flag. This will cause the frontend assets to be built on each request.

## Contributing

Contributions are welcome! Submit your update as a PR; maintainers will review and merge asap.

Make sure your submissions are licensed for free use. All code in Phoenix (including contributions) falls under the license below, or under the licenses attached to included libraries.

You can get help in #scuttlebutt on freenode.

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
