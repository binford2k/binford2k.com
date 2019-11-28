---
layout: post
title: "Docker Docker Docker"
summary: "Quickly stand up a full classroom of containerized agent instances."
image: docker-whales-transparent.png
tags: [puppet, docker, "system administration", "test networks"]
---
One thing we do a lot of at Puppet Labs is release product. And every time we
make a major product release, I have to go through and [update our training
material]({{ site.baseurl }}/2014/11/11/iterative-training/). I validate
all the exercises and examples and code snippets. And when we make UI refreshes
I have to take all new screenshots. That doesn't sound like much--it's just
taking some pictures, right? Well, yeah... but what am I going to take pictures
of? Just firing up a master and screenshotting away isn't very interesting or
informing.

In the early days, I used to toil over this process for days. I'd stand up a
pile of VMs and agonize through my laptop chugging slowly along1. I'd go sign
their certificates, do a few Puppet runs and then kill them so I could stand up
some more and run through it again until I had a large number of stats to make
for interesting screenshots. I did it by hand with VMware Fusion and that was a
pain. I automated it with Vagrant, thinking that would solve all of my
problems--and it solved a few. But I still couldn't run a whole class at once,
so I was staggering runs and spinning nodes up and down and spending almost as
much time on administrivia as when I was doing it by hand. And we don't even
need to get into the mess that's VirtualBox. It wasn't worth it.

![What if I told you there was no cloud?]({{ site.baseurl }}/assets/images/what_if_no_cloud.jpg){:.rightside}

I tried going cloudy with EC2. That helped with the load on my laptop, but then
a whole simulated classroom got rooted within minutes of standing them up. And
then I took a working vacation and the network was crap and I couldn't get to
the machines. And then the cloud instances started exhibiting different failure
states than we saw in the classroom, so it didn't actually alleviate the need
for booting up local VMs.

> EC2 wasn't a panacea. It's a ridiculously valuable part of our offering today, but it doesn't replace local testing.

Today I use something a lot more lightweight. I stand up one fairly hefty VM and
install our [pltraining/dockeragent](https://forge.puppetlabs.com/pltraining/dockeragent)
module on it. That customizes [Gareth's general purpose Docker module](https://forge.puppetlabs.com/garethr/docker)
and boots up images that run a full login environment and a Puppet agent on each.
The code to use it is silly simple.

``` puppet
$names = [ 'harold', 'kumar', 'lorraine', 'christina', 'randall',
           'sarah', 'johnson', 'batman', 'nat', 'zee', 'anderson',
           'matsu', 'kaneshiro', 'rachel', 'shoshanah']

range(1, $names.size - 1).each |$n| {
  dockeragent::node { "${names[$n]}.${::domain}":
    ports => ["${10000 + n}:80"],
  }
}
```

This will stand up a full classroom's worth of containerized agent instances. It
also drops in a simple script to run Puppet on all the nodes or reset all their
SSL certificates so we can run through certificate signing exercises. It can run
the nodes in parallel or serially.

Now all I have to do is manage a single VM. I can do that with Fusion or with
Vagrant or anything I like and it takes no effort at all. I use [Puppet 4 iteration](https://docs.puppetlabs.com/puppet/latest/reference/lang_iteration.html)
to create a Docker container using an agent image for each element of the `$names`
array. It maps a port so I can load the webpage served up by the Capstone exercise.
And it's hardly any effort at all. It's just a Puppet run away.

I can log into any of them with a quick `docker exec -it /bin/bash <container name>`
if needed. I can destroy them at will. They take next to no resources except
during actual catalog application. And it's really easy to take some awesome
screenshots.

If you have need of a number of Puppet agents, for a PUG demonstration or a
conference talk or the like, I encourage you to try our module out. It's
definitely not anything resembling production ready, but it's really good at its
purpose. And if you can help make it more awesome by contributing pull requests!
