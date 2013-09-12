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
    var compress = ~file.indexOf('.min.')
    var css = read(path.join('test', 'fixture', file), 'utf8')
    var ast = parse(css, { position: true })
    file = path.basename(file, '.css')

    it('should compile ' + file, function() {
      var compiled = sheet(ast, { compress: compress })
      comparable(compiled.css).should.eql(comparable(css))
    })

    it('should produce source map for ' + file, function () {
      var original = file + '.css'
      var mapName = original + '.map'
      var compiled = sheet(ast, {
        compress: compress,
        mapUrl: mapName,
        file: original,
        original: original,
        rootUrl: '/foo/bar'
      })
      // The source maps in the test/maps/ directory were verified
      // by using http://sokra.github.io/source-map-visualization/
      var map = read(path.join('test', 'maps', mapName), 'utf8')
      compiled.map.should.equal(map)
    })
  })

  it('should append sourceMappingURL comment', function() {
    var ast = { stylesheet: { rules: [] } }
    var compiled = sheet(ast, { mapUrl: 'foo.map' })
    compiled.css.should.equal('\n/*# sourceMappingURL=foo.map */')
  })

  it('should handle original filename', function() {
    var ast = {
      type: 'stylesheet',
      stylesheet: {
        rules: [
          {
            type: 'rule',
            selectors: [
              'a'
            ],
            declarations: [
              {
                type: 'declaration',
                property: 'b',
                value: 'c',
                position: {
                  start: {
                    line: 1,
                    column: 3
                  },
                  original: 'other.css'
                }
              }
            ],
            position: {
              start: {
                line: 1,
                column: 1
              }
            }
          }
        ]
      }
    }
    var compiled = sheet(ast, { mapUrl: 'foo.map', original: 'orignal.css' })
    compiled.map.should.equal(
      '{"version":3,"file":"foo","sources":["orignal.css","other.css"],"names":[],"mappings":"AAAA,G;ECAE,K;C"}'
    )
  })

  it('should handle missing generated filename', function() {
    var ast = { stylesheet: { rules: [] } }
    var compiled = sheet(ast, { mapUrl: 'foo.css.map' })
    JSON.parse(compiled.map).file.should.equal('foo.css')

    compiled = sheet(ast, { mapUrl: 'foo.css.notmap' })
    JSON.parse(compiled.map).file.should.equal('foo.css.notmap')
  })

})
