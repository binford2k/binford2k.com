---
layout: post
title: "Slicing and dicing Forge usage data"
summary: Identifying usage patterns of Puppet modules and the code they use.
image: graph.png
category:
tags: [puppet, telemetry, metrics, data, development, usage, forge]
---
The Forge content ecosystem is large and complex. There are a lot of modules,
and modules that use resources from other modules. It can be hard to navigate
these relationships when you're deciding how to invest development resources.
For example, it's useful to know how many modules call a function when deciding
whether we should deprecate it.

To assist in making these decisions, the Ecosystem program maintains a publicly
accessible database that can help you weigh the costs of some of these
decisions. You can use the data directly using the [BigQuery console](https://cloud.google.com/bigquery/docs/quickstarts/quickstart-web-ui),
or if your need is simply "which Forge modules use the thing I'm working on"
then you can use our command-line [Rangefinder](https://github.com/puppetlabs/puppet-community-rangefinder) tool.

## Rangefinder

Let's start with the simpler and most common use case. First, install the tool:

```
$ gem install puppet-community-rangefinder
```

Rangefinder will inspect the source file of a component you're working on,
whether it's a Puppet class or defined type, or a function, or a native type,
etc. Simply run the tool against that file and it will print out a list of Forge
modules that use the component created by that file. This will work within a
module, or within the source tree of Puppet itself.

```
$ rangefinder lib/puppet/functions/translate.rb
[translate] is a _function_
==================================
The enclosing module is declared in 8 of 575 indexed public Puppetfiles

Breaking changes to this file WILL impact these modules:
  * puppetlabs-apt (https://github.com/puppetlabs/puppetlabs-apt)
  * puppetlabs-mysql (git://github.com/puppetlabs/puppetlabs-mysql)
  * puppetlabs-docker (git://github.com/puppetlabs/puppetlabs-docker)
  * puppetlabs-kubernetes (https://github.com/puppetlabs/puppetlabs-kubernetes)
  * puppetlabs-concat (https://github.com/puppetlabs/puppetlabs-concat)
  * eputnam-i18ndemo (https://github.com/eputnam/eputnam-i18ndemo)
  * puppetlabs-motd (https://github.com/puppetlabs/puppetlabs-motd)
  * puppetlabs-helm (https://github.com/puppetlabs/puppetlabs-helm)
  * puppetlabs-accounts (https://github.com/puppetlabs/puppetlabs-accounts)
  * albatrossflavour-os_patching (https://github.com/albatrossflavour/puppet_os_patching)

Breaking changes to this file MAY impact these modules:
  * tomkrieger-sshkeymgmt (https://github.com/tom-krieger/sshkeymgmt.git)
```

The difference between `WILL` and `MAY` in this list is the tool's level of
confidence, based on whether the module you're working on is properly declared
in dependent modules' `metadata.json` files. And as you can see, if there's a
known source repository, that will also be printed out so you can make
downstream pull requests if needed.

## BigQuery Console

The data used by Rangefinder is stored in a [public BigQuery dataset](https://console.cloud.google.com/bigquery?utm_source=bqui&utm_medium=link&utm_campaign=classic&project=puppetlabs.com:api-project-531226060619&p=dataops-puppet-public-data&d=community).
The table it primarily uses is the [forge_itemized](https://console.cloud.google.com/bigquery?utm_source=bqui&utm_medium=link&utm_campaign=classic&project=puppetlabs.com:api-project-531226060619&p=dataops-puppet-public-data&d=community&t=forge_itemized&page=table)
table. The table is regenerated weekly by decomposing every module on the Forge
into all the all the functions, types, classes, etc that it declares. This uses
static analysis, so it identifies all elements declared by all code paths, but
it also means that it cannot identify elements declared via a name dynamically
determined at runtime.

![BigQuery Console on the forge_itemized table]({{ site.baseurl }}/assets/images/bigquery_itemized.png)

| Column    | Description                                                              |
|-----------|--------------------------------------------------------------------------|
| `module`  | The name of the module declaring or using the element.                   |
| `version` | The version of the module inspected.                                     |
| `source`  | The module where the element came from, or was defined.                  |
| `kind`    | What kind of element is this; a resource type, a function, a class, etc. |
| `element` | The name of the element declared.                                        |
| `count`   | How many times it was declared in that module.                           |

So to get the list of modules using the `translate()` function, as in the Rangefinder
command above, we could use this SQL query:

``` sql
SELECT module
FROM `dataops-puppet-public-data.community.forge_itemized`
WHERE kind = "function" AND element = "translate"
LIMIT 1000
```

Then to also get the source URL for each of those modules, we could join the `forge_modules` table.

``` sql
SELECT i.module, m.source
FROM `dataops-puppet-public-data.community.forge_itemized` AS i
JOIN `dataops-puppet-public-data.community.forge_modules` AS m
    ON m.slug = i.module
WHERE i.kind = "function" AND i.element = "translate"
LIMIT 1000
```

Or as another example, we could get a list of all functions used in Forge modules, sorted by how often they're used.

``` sql
SELECT element, SUM(count) as count
FROM `dataops-puppet-public-data.community.forge_itemized`
WHERE kind = "function"
GROUP BY element
ORDER BY count DESC
LIMIT 1000
```

The `forge_modules` table records all the Forge modules that exist and surfaces
some information about them. But some of the interesting data is in the
forge_releases table. That shows metadata about each version or release of each
module. This is any information that can change over time with each release, as
well as the raw contents of the metadata.json file, parsed into a hash.

The dataset also includes a set of tables and views replicated from the public
GitHub tables. This allows you to do interesting things like inspect the paths
or the content of the source trees of Puppet modules. For example, you could
find all the Puppet modules in the GitHub universe that still define Puppet 3.x
functions.

``` sql
SELECT DISTINCT f.repo_name
FROM `bto-dataops-datalake-prod.community.github_ruby_files` f
WHERE STARTS_WITH(f.path, 'lib/puppet/parser/functions')
```

And it's pretty easy to join the Forge and GitHub data sources. This query will
identify the 186 Puppet modules on the Forge that define custom native resource
types.

``` sql
SELECT DISTINCT g.repo_name, f.slug
FROM `dataops-puppet-public-data.community.github_ruby_files` g
JOIN `dataops-puppet-public-data.community.forge_modules` f
    ON g.repo_name = REGEXP_EXTRACT(f.source, r'^(?:https?:\/\/github.com\/)?(.*?)(?:.git)?$')
WHERE STARTS_WITH(g.path, 'lib/puppet/type')
LIMIT 1000
```

What other fun things can you do with this data? Perhaps you can build a usage
dashboard to track how people are using functions and types from your published
Forge modules, or you can identify downstream modules using your code so that you
can notify authors before making breaking changes to your module.

Give me a shoutout on [Twitter](https://twitter.com/binford2k) or in our Slack
if you build something interesting!
