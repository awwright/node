// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
'use strict';

const common = require('../common');
const assert = require('assert');
const { Duplex, DuplexPair } = require('stream');

{
  const pair = new DuplexPair();

  assert(pair[0] instanceof Duplex);
  assert(pair[1] instanceof Duplex);
  assert.notStrictEqual(pair[0], pair[1]);
}

{
  // Verify that the iterable for array assignment works
  const [ clientSide, serverSide ] = new DuplexPair();
  assert(clientSide instanceof Duplex);
  assert(serverSide instanceof Duplex);
  clientSide.on(
    'data',
    common.mustCall((d) => assert.strictEqual(`${d}`, 'foo'))
  );
  clientSide.on('end', common.mustNotCall());
  serverSide.write('foo');
}

{
  const [ clientSide, serverSide ] = new DuplexPair();
  assert(clientSide instanceof Duplex);
  assert(serverSide instanceof Duplex);
  serverSide.on(
    'data',
    common.mustCall((d) => assert.strictEqual(`${d}`, 'foo'))
  );
  serverSide.on('end', common.mustCall());
  clientSide.end('foo');
}

{
  const [ serverSide, clientSide ] = new DuplexPair();
  serverSide.cork();
  serverSide.write('abc');
  serverSide.write('12');
  serverSide.end('\n');
  serverSide.uncork();
  let characters = '';
  clientSide.on('readable', function() {
    for (let segment; segment = this.read();)
      characters += segment;
  });
  clientSide.on('end', common.mustCall(function() {
    assert.strictEqual(characters, 'abc12\n');
  }));
}

// Test the case where the the _write never calls [kCallback]
// because a zero-size push doesn't trigger a _read
{
  const [ serverSide, clientSide ] = new DuplexPair();
  serverSide.write('');
  serverSide.write('12');
  serverSide.write('');
  serverSide.write('');
  serverSide.end('\n');
  let characters = '';
  clientSide.on('readable', function() {
    for (let segment; segment = this.read();)
      characters += segment;
  });
  clientSide.on('end', common.mustCall(function() {
    assert.strictEqual(characters, '12\n');
  }));
}
