var sheet = require('..')
  , parse = require('css-parse')
  , fs = require('fs')
  , path = require('path')
  , read = fs.readFileSync
  , readdir = fs.readdirSync

describe('sheet(node)', function() {
  readdir('test/fixture').forEach(function(file) {
    var compress = ~file.indexOf('.min.css')
    file = path.basename(file, '.css')
    it('should compile ' + file, function() {
      var css = read(path.join('test', 'fixture', file + '.css'), 'utf8')
      if (compress) file = file.replace('.min', '')
      var ast = parse(css, { position: true })
      var ret = sheet(ast, { compress: compress })
      ret.css.trim().should.eql(css.trim())
    })
  })

  it('should append sourceMappingURL comment', function() {
    var ast = { stylesheet: { rules: [] }}
    var ret = sheet(ast, { mapUrl: 'foo.map' })
    ret.css.trim().should.equal('/*# sourceMappingURL=foo.map */')
  })

})
