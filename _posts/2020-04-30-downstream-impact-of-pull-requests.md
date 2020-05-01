---
layout: post
title: "Downstream impact of pull requests"
summary: What's the collateral damage if a pull request breaks your module?
image: rangefinder.png
category:
tags: [puppet, telemetry, metrics, data, development, impact analysis]
---

Accepting a pull request carries a certain amount of risk, especially if you have
a lot of downstream users of your code. It's not easy to know the potential impact
of breakage that a PR might introduce to your carefully tested codebase.

A couple weeks ago [I wrote](/2020/04/06/rangefinder) about a tool that can show
a pretty complete analysis of who's using the different part of your Puppet modules.
It can show which parts are heavily used, and which parts are less important.
And it can even link you to the source repositories of those modules, if you'd
like to help your users mitigate issues or upgrade to new versions, or the like.

But that's a local tool. How do you know what kind of impact that a PR might
have without manually running [Rangefinder](https://github.com/puppetlabs/puppet-community-rangefinder)
on your local copy of the module?

That's where the [GitHub App](https://github.com/apps/puppet-community-rangefinder)
comes into play. It's a simple wrapper around Rangefinder that will operate on a
snapshot of your module, running the impact analysis on only the files that the
pull request changes. In other words, if something breaks or if the PR changes
your interfaces, how large could the downstream impact be? The report will be
attached to each PR as a comment.

![An example pull request impact analysis](/assets/images/rangefinder_webhook_comment.png)

Not only does this give you a quick insight into just how broad the introduced
changes could be, but it also gives you direct links to the repositories of
modules that might be impacted. This gives you one-click access to any casualties
and you can investigate further, or even offer pull requests downstream to mitigate
changes. You could even be an exemplary Open Source citizen and notify users of
your module when a pull request corrects a critical issue or vulnerability.


## Usage

Installing and using the integration is super easy, just like any other GitHub App:

1. Visit its [GitHub app page](https://github.com/apps/puppet-community-rangefinder).
2. Click **Install App** in the sidebar.
3. Select your name or an organization you belong to.
4. Then select the repositories you'd like to enable the app on.

There's nothing else to configure. When a pull request occurs on one of the enabled
repository, this will identify whether Rangefinder knows anything about the files
that were changed, and if so post a report on them.


## Implementation

This is a pretty straightforward GitHub App. It's the first I've written, so I
followed their excellent [quickstart tutorial](https://developer.github.com/apps/quickstart-guides/setting-up-your-development-environment/)
and had a working integration in a few hours. Containerizing and uploading to our
cluster didn't take that much longer.

The [code itself](https://github.com/puppetlabs/puppet-community-rangefinder-webhook)
is almost completely a lightly modified example application, with [a few methods](https://github.com/puppetlabs/puppet-community-rangefinder-webhook/blob/6ed72457993ed8c470c79446202730eb2000dafa/lib/rangefinder/webhook.rb#L74-L133)
that invokes Rangefinder as a library, like shown below, and then performs some
content reformatting and generates a rendered comment template.

``` ruby
@impact = @rangefinder.analyze(paths)
```

You might ask quite astutely why this wasn't implemented as a [GitHub Action](https://help.github.com/en/actions/getting-started-with-github-actions).
And the simple answer is that I actually wrote this part last year before
Actions came out of beta and it wasn't yet clear what their functionality might
turn out to be.

Nevertheless, it would also be relatively easy for you to implement Rangefinder
into your own workflows if you'd rather use it that way. It might look something
like this (marginally tested) workflow file:

{% raw %}
``` yaml
name: Rangefinder impact analysis
on: pull_request
jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v1
      with:
        fetch-depth: 1

    - name: Set up Ruby
      uses: actions/setup-ruby@v1

    - name: list files
      run: |
        URL="https://api.github.com/repos/${GITHUB_REPOSITORY}/pulls/${{ github.event.pull_request.number }}/files"
        export FILES=$(curl -s -X GET -G $URL | jq -r '.[] | .filename')
        echo "::set-env name=FILES::$FILES"

    - name: Run analysis
      run: |
        gem install puppet-community-rangefinder
        mkdir output
        rangefinder ${{ env.FILES }} > results.md

    - name: Post report
      uses: machine-learning-apps/pr-comment@master
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        path: results.md
```
{% endraw %}

## What next?

As I [discussed earlier](/2020/04/06/rangefinder/), the Rangefinder tool
currently only uses public data.  This means that it's effectively just
automating something that you could do on your own if you had the time for it.
The real magic will come when we get some insights as to how people are using
your Puppet modules in their own infrastructures.

That's obviously got a *ton* of privacy implications, so we're taking that step
a bit slower. Our internal infrastructure has been running an early version of
the telemetry client for some time now and we're watching for information leakage
along with any performance problems.

Watch for an upcoming post on how we aggregate data so that we can make module
usage statistics public without sharing any private information about your
infrastructure. This means that you'll be able to write your own tooling that
uses this data too. For example, the [Vox Pupuli Tasks dashboard](https://github.com/voxpupuli/vox-pupuli-tasks)
could easily be extended to prioritize the upcoming task list by the relative
size of module usage profiles.

I'm really excited to see what kind of tools the community ends up building around
this data. What sort of ideas do you have? [Tweet them at me](https://twitter.com/binford2k)!
