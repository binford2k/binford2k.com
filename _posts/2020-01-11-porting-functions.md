---
layout: post
title: "Porting the whole world to a new API"
summary: Over the New Year, I automated a mass update to the new Puppet function API.
image: socialite.jpg
category:
tags: [puppet, functions, legacy, port, automation, collaboration]
---

If you maintain Puppet modules, you might have come across a little gift from me
as you got back to coding after the holiday season. It'd be in your GitHub inbox.

[Not long ago](/2019/11/27/automagic-function-port/), I put together a tool to
help port Puppet Ruby functions from the legacy 3.x API to the modern API. Over
the New Year, I ran it through the ringer and updated it to catch a few more
edge cases. Then once I was sure that it ported all valid--or nearly
valid--functions I wrote a simple loop to update every Puppet module in all of
GitHub. Maybe even one of yours.

GitHub maintains a [fantastic public dataset](https://codelabs.developers.google.com/codelabs/bigquery-github/index.html?index=..%2F..index#0)
of all sorts of interesting information about public repositories. This means that
getting a list of all the Puppet modules with legacy functions is as simple as

``` sql
SELECT DISTINCT repo_name
FROM `bigquery-public-data:github_repos.files`
WHERE STARTS_WITH(path, 'lib/puppet/parser/functions')
AND ref = 'refs/heads/master'
```

The BigQuery Console makes it trivial to run a query and save the output. The
first interesting thing I noticed was that the list was far shorter than I had
expected. The list was only about 985 rows, and many of them were clearly
forks. It looked like there were only about 350 unique repository names.

That's not bad at all. That means that we've done a better job at upgrading the
ecosystem than I'd feared.

But before I set my porting robot loose, I wanted more confidence in it. Up until
that point, I'd run it on a limited number of modules, and even so I'd already missed one
[blindingly obvious use case](https://github.com/binford2k/puppet-function-updater/pull/4)!

So I wrote a quick script to clone each repository down, run the porting tool,
and then delete it if successful. Once it completed, I was left with 47 modules
that it had failed on. Some of the errors were trivial and silly. For example,
I'd forgotten that module skeletons of the past had often created the
`lib/puppet/parser/functions` directory with nothing but a quick `README`!

But I did make quite a few improvements. There were a few calling syntaxes that
I hadn't accounted for, and several modules used frozen string literals, and a
few other things. It took a bit of work crawling through code and then updating
my tool to account for the edge cases. But after a few hours of work, I was able
to do another run with no failures except for functions that didn't compile in
the first place.

So then it was time to run for real. I expanded my loop to do a bit more. After
cloning the repository, I also forked it to my own namespace. Then after a successful
port, the script would commit the code, push it to my fork, and then issue a pull
request using the [hub](https://hub.github.com) command-line tool.

I also put in a quick API check to skip forks and only offer fixes to the upstream
repository. This proved problematic, which I'll talk about shortly.

``` ruby
forks     = []
fixed     = []
unchanged = []
failures  = []

repositories.each do |repo|
  next unless repo.include?('/')
  puts "INFO: processing #{repo}"

  # This proved to not be robust enough!
  if `curl -s https://api.github.com/repos/#{repo} | jq ".fork"`.strip == 'true'
    puts "INFO: Skipping fork: #{repo}"
    forks << repo
    next
  end

  user, project = repo.split('/')
  begin
    raise repo unless system("git clone git@github.com:#{repo}.git")
    Dir.chdir(project) do
      raise repo unless system('hub fork')

      # This does the actual work of generating the new functions
      raise repo unless system("puppet_function_updater")

      if (`git status --porcelain | wc -l `.to_i == 0)
        unchanged << repo
        next
      else
        puts "INFO: Recording changes for #{repo}"

        raise repo unless system('git add .')
        raise repo unless system("git commit -m 'Porting functions to the modern Puppet 4.x API'")
        raise repo unless system('git push binford2k')
        raise repo unless system('hub pull-request -F ../../message.md')
      end
    end
    fixed << repo
  rescue => e
    failures << repo
    puts "WARN: Repo #{repo} failed: #{e.message}"
    puts e.backtrace.first
  end

  FileUtils.rm_rf(project)
  system("hub delete -y binford2k/#{project}")

  sleep(30) # make sure we don't get rate limited
end
```

I started the script running and validated that it was processing the list and
submitting pull requests. Then my partner and I headed out for an evening. *(And by
that I mean, distract me from the idea that it might break and spew garbage PRs
all over the ecosystem!)*

At the crack of noon the next day, I checked in on the [list of pull requests](https://github.com/search?q=is%3Apr+author%3Abinford2k+Porting+functions+to+the+modern+Puppet+4.x+API&type=Issues)
to find a small surprise! Instead of the 350 or so that I expected, I was
looking at a list of over 500 pull requests. Clearly my fork detection didn't
work reliably.  The best I can guess without logging or error checking was that
I'd been rate limited and instead of JSON to parse, my curl call was returning
an API error.  Clearly I should have been using the Octokit gem directly instead
of being lazy and just shelling out.

But otherwise, everything seems to have gone as expected. The response was a
little mixed, everything from

> Cute idea, however I'm not going to merge it unless someone gives it a smoke test at least.

to

> I love this initiative by @binford2k ❤️ #puppetize #opensource

The most annoying inconvenience was that it created [detached pull requests](https://github.com/example42/puppet-network/pull/301#issuecomment-570910424),
which meant that collaborators couldn't update the PR and keep the complete
function port contained within a single PR. I don't want 500 extra repositories
cluttering up my namespace, so the script had deleted each one after submitting
the pull request.

There were also a handful of autoresponders that instructed me (or my script 🤣)
to do things that I didn't quite have the motivation for. For example, OpenStack
sent me to the [Developer's Guide](https://docs.openstack.org/infra/manual/developers.html)
with instructions to set up an Ubuntu One account and configure Gerrit. Another bot
told me to request a review, but then linked to a doc that didn't exist!

One of my favorite outcomes was how many old and unmaintained repositories it's
already identified. A pet peeve of mine is stumbling into a GitHub repository and
not knowing if it's still maintained, or where the fork that *is maintained* might
exist. Many responses to the PR this submitted were to delete or archive a forgotten
and unmaintained codebase and a cleaner ecosystem always makes me happy.

Looking back at the results, there were a few things that I should have done
slightly differently. It may have been worth creating a dedicated GitHub user
and just leaving the source repositories in place to avoid the detached pull requests.
I should also have also DCO signed my commits with the
[Developer Certificate of Origin](https://developercertificate.org).

In any case, I think I'm calling this a resounding success. This is the largest
ecosystem update that I've automated so far, and I'd by lying if I said I wasn't
a bit nervous as I kicked it off. Nevertheless, each time I learn a little more.
And each time more ideas mature about the next way for improving the Puppet
developer ecosystem.


## Learn more

* Check out the [`puppet-function-updater` project on GitHub](https://github.com/binford2k/puppet-function-updater)
* Read more about [refactoring legacy Ruby functions](https://puppet.com/blog/refactoring-legacy-ruby-functions/).
* See [work on a similar project](https://github.com/dependabot/dependabot-core/pull/1287) adding Puppet support to Dependabot.
