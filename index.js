var basename = require('path').basename
var SourceMapGenerator = require('source-map').SourceMapGenerator

/**
 * Serialize the given AST node.
 */
module.exports = function(node, opts) {

  opts = opts || {}
  var compress = opts.compress
    , indentation = opts.indent || '  '
    , css = ''
    , line = 1
    , column = 1
    , level = 1
    , sourceMap

  if (opts.map) {
    if (opts.sourceMappingURL === undefined && opts.file) {
      opts.sourceMappingURL = opts.file + '.map'
    }
    sourceMap = new SourceMapGenerator({
      file: opts.file || '?',
      sourceRoot: opts.sourceRoot
    })
  }

  /**
   * Add a mapping to the source map, from the current location to the
   * original location of the given node. Pass null to indicate that
   * the current location is not associated with any original
   * location.
   */
  function addMapping(node) {
    if (!sourceMap || (node && !node.position)) return

    sourceMap.addMapping({
      original: node && adjustColumn(node.position.start),
      generated: adjustColumn({
        line: line,
        column: column
      }),
      source: node && (node.position.source || '?'),
      name: node && node.position.name
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
   * Append the given `str`. If compression is turned on, `str` is
   * trimmed first.
   */
  function write(str) {
    if (typeof str != 'string') throw new TypeError()
    if (compress) str = str.trim()
    css += str
    column += str.length
  }

  /**
   * Append the given `str`, and unless compression is turned on, a
   * new line with the same amount of indentation as the last line.
   */
  function writeln(str) {
    if (arguments.length) write(str)
    if (compress) return
    addMapping(null)
    css = css.replace(/[ \t]+$/, '')
    var currentIndent = new Array(level).join(indentation)
    css += '\n' + currentIndent
    line++
    column = 1 + currentIndent.length
  }

  /**
   * Indent, unless compression is turned on.
   */
  function indent() {
    if (compress) return
    level++
    css += indentation
    column += indentation.length
  }

  /**
   * Dedent, unless compression is turned on.
   */
  function dedent() {
    if (compress || level === 0) return
    level--
    css = css.slice(0, -indentation.length)
    column -= indentation.length
  }

  /**
   * Invoke `fn` for each item in `nodes`.
   */
  function each(nodes, fn, newLine) {
    if (newLine === undefined) newLine = true
    var last = nodes.length-1
    nodes.forEach(function(node, i) {
      fn(node, i === last)
      if (i !== last && newLine) writeln()
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
    addMapping(node)
    var newlines = node.comment.match(/\r\n|\r|\n/g) || []
    line += newlines.length
    writeln('/*' + node.comment + '*/')
  }

  /**
   * Visit an import node.
   */
  function atImport(node) {
    addMapping(node)
    write('@import ' + node.import + ';')
  }

  /**
   * Visit a media node.
   */
  function atMedia(node) {
    addMapping(node)
    write('@media ' + node.media)
    writeln(' {')
    indent()
    each(node.rules, visit)
    dedent()
    writeln('}')
  }

  /**
   * Visit a charset node.
   */
  function atCharset(node) {
    addMapping(node)
    writeln('@charset ' + node.charset + ';')
  }

  /**
   * Visit a keyframes node.
   */
  function atKeyframes(node) {
    addMapping(node)
    write('@' + (node.vendor || '') + 'keyframes ' + node.name)
    writeln(' {')
    indent()
    each(node.keyframes, keyframe, false)
    dedent()
    writeln('}')
  }

  /**
   * Visit a keyframe node.
   */
  function keyframe(node, last) {
    if (node.comment) comment(node)
    else {
      addMapping(node)
      write(node.values.join(', '))
      writeln(' {')
      indent()
      declarations(node.declarations)
      dedent()
      writeln('}')
      if (!last) writeln()
    }
  }

  /**
   * Visit a rule node.
   */
  function rule(node) {
    var last = node.selectors.length-1
    node.selectors.forEach(function(s, i) {
      // Each selector is simply a string, and not a real node, so
      // we have to map them to the beginning of the node.
      addMapping(node)
      write(s)
      if (i != last) writeln(',')
    })

    writeln(' {')
    indent()
    declarations(node.declarations)
    dedent()
    writeln('}')
  }

  /**
   * Visit a declaration node.
   */
  function declarations(nodes) {
    each(nodes, function(node, last) {
      if (node.comment) comment(node)
      else {
        addMapping(node)
        write(node.property + ': ')
        write(node.value)
        if (!(compress && last)) write(';')
        writeln()
      }
    }, false)
  }

  each(node.stylesheet.rules, visit)
  css = css.trim()
  if (sourceMap && opts.sourceMappingURL) {
    css += '\n/*# sourceMappingURL=' + opts.sourceMappingURL + ' */'
  }

  return {
    css: css,
    map: sourceMap && sourceMap.toString(),
    sourceMap: sourceMap,
    toString: function() {
      return css
    }
  }

}
