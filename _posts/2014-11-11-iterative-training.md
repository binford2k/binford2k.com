---
layout: post
title: "Rapidly iterating training materials"
summary: "Agile practices in traditional classroom training content?"
image: cat_hat_juggling.jpg
tags: [learning, development, education, training]
---
The traditional development cycle for training courses, technical or otherwise,
is a little different from the software development you may be used to. Think of
all the artifacts in a typical training course. You probably get manuals to take
home. There might be a few videos to watch. Instructors must be trained on the
material. Labs and exercises must be designed and tested and tested again.
Marketing assets must be generated and distributed. Facilities must be booked,
along with any network requirements. If it sounds exhausting, that's because it
is. That's why most training courses have a measured development cycle. A course
is developed, proofread, tested, debugged, and then released. Put a fork in it,
because it's done. Time to start again on the next course--scheduled for release
in 6-8 months if you're lucky.

My Puppet Labs training is a little different. We move at a different cadence
and might release three times in a week, if needed. Read on to find out why and
how we manage this without losing our sanity.

Our training department works closely with the Engineering team and the Docs
team to generate material ahead of time, but nothing replaces real world testing
of the final product. To meet our exacting quality standards in a traditional1
development process, we would require a long testing and revision process after
each Puppet Enterprise release dropped. That's not acceptable. We pride
ourselves on releasing training courseware updates along with every major Puppet
Enterprise releases. This means that we have to be ready with new material the
day the PE download drops.

And the reality of working with a fast moving software project is that... well,
that it's fast moving. Doubly so if it's built on an Open Source core, because
that allows us to iterate that much more quickly. That means that our courseware
has to be that much more agile, just to keep up.

We manage that by a combination of smart tooling, a light process with multiple
checkpoints to catch errors, and trusting in in our people.

In the early days of the company, our training consisted of not much more than a
professional services engineer shooting from the hip with a cobbled together
slide deck of material. Often as not, that material was developed on the plane
on the way to the training (You think I jest... how cute.) We would correct
errors as we caught them and each time a new version of Puppet Enterprise was
released, we'd just update the material as needed so we were never out of date.

As the company grew up, the training matured too. Before long, we were doing all
the things that real training departments did, like provide actual real paper
training manuals, tested exercises, and sample solutions. We also produced
versioned releases of the courseware.

We were a small team still defining who we were and building our first courses,
so this worked out nicely and for a while all was peachy. Then the update cycle
started. PE 2.5 came out, then 2.6, and 2.7, 2.8. Each new version of the
product had major changes and new features we had to teach. Keeping up with the
product release meant that we had to iterate quickly and push out a new release
as soon as possible. The forced update meant that errors would be caught soon
after release, so we'd have to push out an errata update... and then another.
Each time we released, we would update the material our instructors taught from
and we'd ship out new book versions. We made sure that every single instructor
got the new books at exactly the same time. Or at least we tried. What we really
ended up doing was reaching out to three or four instructors every few weeks to
let them know that they'd been shipped the wrong book version and that they
should not update to the current courseware material.

Coordinating each simultaneous release to a team of five instructors, and then
ten, and then twenty became an irritating task and then a difficult task, and
finally untenable. Something had change.

![Bottleneck sign]({{ site.baseurl }}/assets/images/bottleneck.jpg){:.leftside}

We did some navel gazing and came to the realization that coordinating the book
printing and shipping was the bottleneck. Our instructors were perfectly capable
of teaching whatever version we gave them and it was just a matter of getting
them the right books. And then the critical insight happened: aside from
aligning with the major product releases, did it really matter which version was
taught in each classroom? If Tom taught v2.8.5 and Gary taught v2.8.6 did
anybody lose out?

> Coordinating a simultaneous release wasn't worth the hassle.

Instead, we focused on the bottleneck. [Does that sound familar](http://itrevolution.com/books/phoenix-project-devops-book/)?

Our courseware material was delivered the same way we developed it, via git. So
we utilized the features of git to build an agile and robust delivery system.

1. We developed tooling that ensured that there was no way to make a release
   without generating both printable copies of the manuals and a git tag of the
   release version. Most critically, the version tag was printed in the book. Easy
   enough to do.
1. Then we added tooling around the classroom delivery so that the instructor could
   teach any released version of the courseware.
1. Finally, we just shipped whatever the latest book the printer had to each
   classroom. There was no coordination at all--except for the major product
   releases.

When the instructor arrived in class, he or she would simply check to see which
version of books had arrived and teach to that version. Even more so, the
tooling self updated and made it second nature to always teach the right content
without putting any thought into it. Since then we've never had a complaint that
the printed material and the projected content didn't match and we've never had
an instructor panicked that the printed copy of their material was the wrong
version. I consider that a big win.

Even better, it meant that we didn't need to send out update notifications, or
time the printing pipeline or work to make sure that Australia got the books at
the same time that the US did. We simply pumped releases in to this end of the
pipeline and on the other end, the training coordinators ordered & shipped
whatever the most current version happened to be.

The second major part of our process is that we trust and enable our trainers to
be active in the development process. We maintain [our own presentation tool](http://puppetlabs.github.io/showoff),
meaning that we aren't beholden to the whims of another company's feature list.
I added a button to the presenter that made it a ten second task to file a
ticket in our issue tracker on any given slide. Honestly, the first thing that
did was increase our need for incoming issue triage, but the second and more
lasting effect is that I always know what I can do to improve our material.
Usually in excruciating detail.

> If I push out a release and it's got a problem, I'll hear about it before the week is done.

The interesting effect that this has had is that it keeps instructors engaged in
the material. Often the ticket is accompanied by a pull request to fix the
reported issue. As this has become ingrained culture in the instructors, I've
begun to trust in my own releases more and more because I've got a defense line
of very capable instructors to back me up.

This isn't to claim that all is ponies and rainbows. But Puppetlabs just made
what may be the biggest and most significant release in forever, and Education
was right alongside with our corresponding training update. We didn't have two
months to test and that's OK. We'll push out an errata update or five in next
couple weeks and life will go on like usual.

You might be thinking that this isn't such a big deal, and essentially you're
right. All I'm doing is selectively applying tenets of agile software
development to the development of traditional classroom training. But that in
itself is pretty damn groundbreaking.
