# sheet [![Build Status](https://travis-ci.org/fgnass/sheet.png)](https://travis-ci.org/fgnass/sheet)

CSS compiler with built-in source map support. Generates CSS from an AST like
the one provided by [css-parse](https://github.com/visionmedia/css-parse) (if
you use that particular module, make sure to turn its `position` option on,
and to pass in the `source`).

## Usage

```js
var sheet = require('sheet')
var ast = { stylesheet: { rules: [] }}
var s = sheet(ast, { compress: true, map: true, file: 'foo.css' })
console.log(s.css)
console.log(s.map)
```

`sheet(ast, [options])` returns:

```js
{
  css: css,
  map: sourceMap.toString(),
  sourceMap: sourceMap,
  toString: function() {
    return css
  }
}
```

## Options

- `indent`: The indentation to use. Default: Two spaces.
- `compress`: Skip comments and whitespace. Default: Off.
- `map`: Create source map. Default: Off.
- `file`: The name of the file that you will store the generated CSS in, which
  will be associated with the source map. Default: "?".
- `sourceMappingURL`: The url to put in the `# sourceMappingURL=` comment.
  Default: `file + '.map'`. Pass `false` to omit the comment.
- `sourceRoot`: The optional root for all relative source URLs in the source
  map.

## The MIT License (MIT)

Copyright (c) 2013 Felix Gnass

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
