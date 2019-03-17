const _ = require('lodash/fp')
const formatBadge = require('./format-badge')
const formatContributor = require('./format-contributor')

const badgeRegex = /\[!\[All Contributors\]\([a-zA-Z0-9\-./_:?=]+\)\]\(#\w+\)/

function injectListBetweenTags(newContent) {
  return function(previousContent) {
    const tagToLookFor = '<!-- ALL-CONTRIBUTORS-LIST:'
    const closingTag = '-->'
    const startOfOpeningTagIndex = previousContent.indexOf(
      `${tagToLookFor}START`,
    )
    const endOfOpeningTagIndex = previousContent.indexOf(
      closingTag,
      startOfOpeningTagIndex,
    )
    const startOfClosingTagIndex = previousContent.indexOf(
      `${tagToLookFor}END`,
      endOfOpeningTagIndex,
    )
    if (
      startOfOpeningTagIndex === -1 ||
      endOfOpeningTagIndex === -1 ||
      startOfClosingTagIndex === -1
    ) {
      return previousContent
    }
    return [
      previousContent.slice(0, endOfOpeningTagIndex + closingTag.length),
      '\n<!-- prettier-ignore -->',
      newContent,
      previousContent.slice(startOfClosingTagIndex),
    ].join('')
  }
}

function formatLine(contributors) {
  // return `<td align="center">${contributors.join('</td><td align="center">')}</td>`
  return `<li style="margin: 0; padding: 10px; text-align: center;">${contributors.join(
    '</li><li style="margin: 0; padding: 10px; text-align: center;">'
  )}</li>`
}

function generateContributorsList(options, contributors) {
  return _.flow(
    _.map(function formatEveryContributor(contributor) {
      return formatContributor(options, contributor)
    }),
    _.chunk(options.contributorsPerLine),
    _.map(formatLine),
    // _.join('</tr><tr>'),
    _.join(''),
    newContent => {
      // return `\n<table><tr>${newContent}</tr></table>\n\n`
      return `\n<ul style="display: flex; flex-wrap: wrap; margin: 0; padding: 0; list-style: none;">${newContent}</ul>\n\n`
    },
  )(contributors)
}

function replaceBadge(newContent) {
  return function(previousContent) {
    const regexResult = badgeRegex.exec(previousContent)
    if (!regexResult) {
      return previousContent
    }
    return (
      previousContent.slice(0, regexResult.index) +
      newContent +
      previousContent.slice(regexResult.index + regexResult[0].length)
    )
  }
}

module.exports = function generate(options, contributors, fileContent) {
  const contributorsList =
    contributors.length === 0
      ? '\n'
      : generateContributorsList(options, contributors)
  const badge = formatBadge(options, contributors)
  return _.flow(
    injectListBetweenTags(contributorsList),
    replaceBadge(badge),
  )(fileContent)
}
