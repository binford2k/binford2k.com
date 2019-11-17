---
layout: post
title: "The oh-so-unintuitive Monty Hall problem"
image:
category:
tags: [math, logic]
---
I ran into yet another explanation of the Monty Hall problem the other day that
was rather difficult to follow and it struck me that even though it's a simple
problem, I still have not seen an explanation that makes intuitive sense. So
here's my take at it.

In case you haven't seen it before, the problem goes a bit like this. You are
faced with three doors. Behind one door is a new car and behind the other two
doors are goats. Choose a door.

Once you've picked a door, the host will instead open one of the remaining doors
to reveal a goat. Now you are given the opportunity to change your choice of
doors. Do you stick with your choice or switch? Why?

Supposedly, [most people double down and stand firm with their choice](http://en.wikipedia.org/wiki/Monty_Hall_problem)
even though mathematically it's the wrong choice. More curiously, people have a
hard time understanding why it's the wrong choice. Intuitively speaking, you've
simply got a 50/50 chance now, so why bother changing it up?

Most explanations focus on the fact that the host is offering up new information
by revealing one of the goats. I don't think that's actually all that relevant.
Instead, I'll talk about grouping a bit and hopefully make it obvious why the
odds work out the way they do.

![Jewelry boxes]({{ site.baseurl }}/assets/images/boxes.png){:.leftside}

For convenience, let's also talk about jewelry boxes instead of doors, cars, and
goats. Imagine three jewelry boxes. One has a fabulous diamond ring, and two
have the more elemental state of the same--namely lumps of coal.

Choose one of the boxes--maybe A sounds good. The probability that you've chosen
the diamond ring is one in three or 1/3, and the probability that you've gotten
a lump of coal is 2/3.

Now let's toss those jewelry boxes into a couple buckets. One bucket contains
your chosen box and the other contains the other boxes. I think you'll agree
that this won't change the probabilities of you choosing the ring?

![Buckets]({{ site.baseurl }}/assets/images/buckets_of_boxes.png){:.rightside}

Taking that one step further, we can then logically deduce, that bucket one
(holding a single box) has a 1/3 probability of holding the diamond ring and
bucket two (holding two boxes) has a 2/3 probability. You're still holding fast
at a 1/3 probability of scoring the ring. If you were able to choose between
buckets, which would you choose?

Now, logically speaking, since there is only a single ring and two lumps of
coal, bucket two must have at least one of those chunks of nothing. It's either
holding two lumps of coal or a lump of coal and a diamond ring. But in either
case, it's got a 2/3 chance of holding the diamond ring, since we haven't
changed the choices at all, we've just dropped them into a couple buckets.

We don't really care about that extra lump of coal, so I'll reach in bucket two,
root around for a moment and pull it out. We already knew that it had to have at
least one coal, so this won't change anything about probabilities.

Now you have a choice. But instead of of thinking about the boxes this time,
think about the buckets. Which bucket has a higher chance of winning? All I've
told you by opening one of the boxes was that either box B or box C didn't have
the ring in it--and you already knew that!

Clearly you want the bucket with the 2/3 chance of winning, so you should switch
your choice to the remaining jewelry box in bucket two.
