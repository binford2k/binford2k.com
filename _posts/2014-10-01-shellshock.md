---
layout: post
title: "Using MCollective to generate spiffy Shellshock reports for your boss"
image: shellshock.jpg
category:
tags: [shellshock, security, vulnerability, mcollective, facter, facts.d]
---
If you haven't heard of Shellshock, you should crawl out from under your rock
and do some Googling. Back? Ok, great. I won't explain what it is, but if you're
reading this post, you've probably been tasked to find and patch all vulnerable
systems. And management would like to see a comprehensive report of which
machines have been patched....

Luckily enough, with Puppet, Facter, and MCollective, that's a trivial task.

First, let's start by creating a fact. As this is a Bash flaw we're testing, it
will be most straightforward to write a shell script executed by `/bin/bash`. That
lends itself well to an executable external fact. As a reminder, Facter will run
any executable files in the `facts.d` directory and turn the `key=value` output
into facts.

``` bash
#!/bin/bash
# shellshock.sh
#
# Tests for Shellshock vulnerabilities and simply outputs one of the following
#   shellshock=vulnerable
#   shellshock=patched

exec 2>/dev/null

DIR=$(pwd)
TEMP=$(mktemp -d)

cd $TEMP

echo "shellshock=patched" > output
env x='() { :;}; echo shellshock=vulnerable > output' bash -c "true"
env 'x=() { :;}; echo shellshock=vulnerable > output' 'BASH_FUNC_x()=() { :;}; echo shellshock=vulnerable > output' bash -c "true"
env 'x=() { (a)=>\' bash -c "true date"; [[ -f 'true' ]] && echo "shellshock=vulnerable" > output

cat output

cd $DIR
rm -rf $TEMP
```

Now that we've got a fact, the next step is to put it on the agent nodes. Until
external fact syncing is more supported, we need to do that manually. Let's do
that with a little snippet of Puppet code inside a module.

```
class shellshock {
    file { '/etc/puppetlabs/facter/facts.d/shellshock.sh':
        ensure => file,
        owner  => 'root',
        group  => 'root',
        mode   => '0755',
        source => 'puppet:///modules/shellshock/shellshock.sh',
    }
}
```

Now just classify your machines and force a Puppet run with `sudo -iu peadmin mco puppet runall 5`.

The final step is to generate the vulnerability report for your boss. Create a
report script named `shellshock.mc` that looks a bit like this:

``` perl
# shellshock.mc
formatted_inventory do
    page_length 20

    page_heading <<TOP

      Shellshock Vulnerabilities as of @<<<<<<<<<<<<<<<<<<<<<<<<<
                                             time

Hostname:              Status:            Operating System
-------------------------------------------------------------------------
TOP

    page_body <<BODY
@<<<<<<<<<<<<<<<<     @<<<<<<<<<<<<        @<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
identity,             facts["shellshock"], facts["osfamily"]
BODY
end
end
```

Finally, use MCollective to run the script and gather Shellshock stats about
your infrastructure. You'll need the `formatr` gem installed to use the `perlform`
report syntax shown.

```
[root@master ~]# /opt/puppet/bin/gem install formatr
Fetching: formatr-1.10.1.gem (100%)
Successfully installed formatr-1.10.1
1 gem installed
Installing ri documentation for formatr-1.10.1...
Installing RDoc documentation for formatr-1.10.1...
[root@master ~]# su - peadmin
peadmin@master:~$ vim report.mc
peadmin@master:~$ mco inventory --script report.mc

      Shellshock Vulnerabilities as of 2014-10-02 01:27:53 +0000

Hostname:              Status:            Operating System
-------------------------------------------------------------------------
master.puppetlabs.vm   vulnerable         RedHat
agent1.puppetlabs.vm   patched            RedHat
agent2.puppetlabs.vm   vulnerable         RedHat
```

There you are! A nice quick and pretty report of all the vulnerable machines in
your infrastructure.

## References:

* [https://docs.puppetlabs.com/facter/2.2/custom_facts.html#external-facts](https://docs.puppetlabs.com/facter/2.2/custom_facts.html#external-facts)
* [https://docs.puppetlabs.com/mcollective/reference/ui/nodereports.html](https://docs.puppetlabs.com/mcollective/reference/ui/nodereports.html)
