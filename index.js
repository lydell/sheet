var SourceMapGenerator = require('source-map').SourceMapGenerator

/**
 * Serialize the given AST node.
 */
module.exports = function(node, opts) {

  opts = opts || {}
  var compress = opts.compress
    , indentation = opts.compress ? '' : opts.indent || '  '
    , css = ''
    , line = 1
    , column = 1
    , level = 1
    , sourceMap

  if (opts.map || opts.mapUrl) {
      sourceMap = new SourceMapGenerator({
      file: opts.file || '',
      sourceRoot: opts.rootUrl
    })
  }

  /**
   * Adjust the column by `-1`.
   * The source-map module expects zero-based column numbers, whereas
   * line-numbers start at one.
   */
  function adjustColumn(pos) {
    return { line: pos.line, column: pos.column-1 }
  }

  /**
   * Add the given mapping to the source map.
   */
  function addMapping(m) {
    sourceMap.addMapping({
      generated: adjustColumn(m.generated),
      original: adjustColumn(m.original),
      source: m.original.file || opts.original || '?',
      name: m.original.name || ''
    })
  }

  /**
   * Append the given `str`.
   * If `indent` is omitted the default indentation is applied.
   * If `indent` is falsy `str` is append without indentation.
   * In compression mode all indetation is ignored.
   */
  function write(str, indent) {
    if (typeof str != 'string') throw new TypeError()
    if (!compress) {
      if (indent === undefined) {
        indent = new Array(level).join(indentation)
      }
      if (indent) {
        css += indent
        column += indent.length
      }
    }
    css += str
    column += str.length
  }

  /**
   * Append the given `str` followed by a line break.
   * This increases the internal line counter by one unless compression is turned
   * on, in which case no line breaks are added.
   */
  function writeln(str, indent) {
    if (arguments.length) write(str, indent)
    if (!compress) {
      css += '\n'
      line++
      column = 1
    }
  }

  /**
   * Invoke `fn` for each item in `nodes`.
   */
  function each(nodes, fn) {
    var last = nodes.length-1
    nodes.forEach(function(node, i) {
      fn(node)
      if (i !== last) writeln()
    })
  }

  /**
   * Visit the given node.
   */
  function visit(node) {
    if (node.comment) comment(node)
    else if (node.charset) atCharset(node)
    else if (node.keyframes) atKeyframes(node)
    else if (node.media) atMedia(node)
    else if (node.import) atImport(node)
    else rule(node)
  }

  /**
   * Visit a comment node.
   */
  function comment(node) {
    if (compress) return
    writeln('/*' + node.comment + '*/')
    var newlines = node.comment.match(/\n/g)
    if (newlines) line += newlines.length
  }

  /**
   * Visit an import node.
   */
  function atImport(node) {
    write('@import ' + node.import + ';')
  }

  /**
   * Visit a media node.
   */
  function atMedia(node) {
    write('@media ' + node.media)
    writeln('{', ' ')
    level++
    each(node.rules, visit)
    level--
    writeln('}')
  }

  /**
   * Visit a charset node.
   */
  function atCharset(node) {
    writeln('@charset ' + node.charset + ';')
  }

  /**
   * Visit a keyframes node.
   */
  function atKeyframes(node) {
    write('@' + (node.vendor || '') + 'keyframes ' + node.name)
    writeln('{', ' ')
    level++
    each(node.keyframes, keyframe)
    level--
    writeln('}')
  }

  /**
   * Visit a keyframe node.
   */
  function keyframe(node) {
    write(node.values.join(', '))
    writeln('{', ' ')
    level++
    declarations(node.declarations)
    level--
    writeln('}')
  }

  /**
   * Visit a rule node.
   */
  function rule(node) {
    if (sourceMap && node.position) {
      var indent = (level-1) * indentation.length
      addMapping({
        original: node.position.start,
        generated: {
          line: line,
          column: column + indent
        }
      })
    }

    var last = node.selectors.length-1
    node.selectors.forEach(function(s, i) {
      write(s)
      if (i == last) writeln('{', ' ')
      else writeln(',')
    })

    level++
    declarations(node.declarations)
    level--
    writeln('}')
  }

  /**
   * Visit a declaration node.
   */
  function declarations(nodes) {
    var last = nodes.length-1
    nodes.forEach(function(node, i) {
      if (node.comment) comment(node)
      else {
        write(node.property + ':')
        write(node.value, ' ')
        if (i != last) write(';', false)
        writeln()
      }
    })
  }

  each(node.stylesheet.rules, visit)
  if (opts.mapUrl) css += '\n/*# sourceMappingURL=' + opts.mapUrl + ' */'

  return {
    css: css,
    map: sourceMap && sourceMap.toString(),
    sourceMap: sourceMap,
    toString: function() {
      return css
    }
  }

}