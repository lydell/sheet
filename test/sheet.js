var sheet = require('..')
  , parse = require('css-parse')
  , fs = require('fs')
  , path = require('path')
  , read = fs.readFileSync
  , readdir = fs.readdirSync

function comparable(string) {
  return string.trim().replace(/\r\n|\r/g, '\n')
}

describe('sheet', function() {
  readdir(path.join('test', 'fixture')).forEach(function(file) {
    var css = read(path.join('test', 'fixture', file), 'utf8')
    file = path.basename(file)
    var compress = ~file.indexOf('.min.')
    var ast = parse(css, { position: true, source: file })

    it('should compile ' + file, function() {
      var compiled = sheet(ast, { compress: compress })
      comparable(compiled.css).should.eql(comparable(css))
    })

    it('should produce source map for ' + file, function () {
      var compiled = sheet(ast, {
        compress: compress,
        map: true,
        file: file,
        sourceRoot: '/foo/bar'
      })
      // The source maps in the test/maps/ directory were verified
      // by using http://sokra.github.io/source-map-visualization/
      var map = read(path.join('test', 'maps', file + '.map'), 'utf8')
      compiled.map.should.equal(map)
    })
  })

  it('should append sourceMappingURL comment if appropriate', function() {
    var ast = { stylesheet: { rules: [] } }

    var compiled = sheet(ast, { map: true, sourceMappingURL: 'foo.map' })
    compiled.css.should.equal('\n/*# sourceMappingURL=foo.map */')

    var compiled = sheet(ast, { map: true, file: 'foo.bar' })
    compiled.css.should.equal('\n/*# sourceMappingURL=foo.bar.map */')

    var compiled = sheet(ast, { map: true, file: 'foo.bar', sourceMappingURL: false })
    compiled.css.should.equal('')

    var compiled = sheet(ast, { map: true })
    compiled.css.should.equal('')

    var compiled = sheet(ast, { map: false, sourceMappingURL: 'foo.map' })
    compiled.css.should.equal('')
  })

})
