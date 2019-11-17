---
layout: post
title: "Party photos ftw"
image: photobooth.jpg
category:
tags: [fun, frivolity, "toy projects"]
---
So you're throwing a party and you think it'd be brilliant to have a photo booth
that automatically posted photos to the Internet for all to see? Not to worry,
I've got your back.

Kari wanted to have a photo booth at our most recent Halloween party, mostly
because derby girls love to take wacky photos, and asked me to set this up. I
could have easily just fired up [Photo Booth](http://en.wikipedia.org/wiki/Photo_Booth)
and let it be, but as you might guess that was clearly not enough. She wanted
the photo booth in the basement for crowd control purposes but we didn't want
people to feel like they were squirreled away in the corner, or that they had to
crowd around the booth to be part of the fun. We had an old Windows PC in the
living room jamming Pandora, so why not just stream the photos and display them
there?

![Twitterpunch photo]({{ site.baseurl }}/assets/images/twitterpunch.jpg)

After a bit of Googling I'd discovered nothing to do what I wanted, so like any
good nerd I built it myself. I'd like to introduce [Twitterpunch](https://github.com/binford2k/twitterpunch)
and teach you how to use it yourself. There's a fair amount of initial
configuration, but once it's going you'll be able to use it for any event with
only a minute of setup time.

## Installation:

You'll need two computers, one with a webcam. For simplicity's sake, I'll assume
that you're using Macs with reasonably recent installations of OS X, but this
will run equally well on Windows or Linux except for Windows lacking basic SDL
features like translucence. Towards the end, I'll give you a few tips for other
setups.

Since OS X has Ruby built in, installing Twitterpunch is trivial. On other
platforms, you may need to install Ruby first. You'll want to install
Twitterpunch on both computers.

```
[ben@ganymede] ~ $ sudo gem install twitterpunch
Password:
Fetching: ffi-1.9.6.gem (100%)
Building native extensions.  This could take a while...
Successfully installed ffi-1.9.6
Fetching: nice-ffi-0.4.gem (100%)
Successfully installed nice-ffi-0.4
Fetching: ruby-sdl-ffi-0.4.gem (100%)
Successfully installed ruby-sdl-ffi-0.4
Fetching: rubygame-2.6.4.gem (100%)
Successfully installed rubygame-2.6.4
Fetching: twitterpunch-0.0.4.gem (100%)

  ************************************************************************
  Be aware that RubyGame is BROKEN on OSX right now. You will need this
  patch before Twitterpunch will work properly:

  https://github.com/xrs1133/ruby-sdl-ffi/commit/0b721ac4659b4c08cda5aa2f418561a8a311e85b

  ************************************************************************

Successfully installed twitterpunch-0.0.4
Parsing documentation for ffi-1.9.6
Installing ri documentation for ffi-1.9.6
Parsing documentation for nice-ffi-0.4
Installing ri documentation for nice-ffi-0.4
Parsing documentation for ruby-sdl-ffi-0.4
Installing ri documentation for ruby-sdl-ffi-0.4
Parsing documentation for rubygame-2.6.4
Installing ri documentation for rubygame-2.6.4
Parsing documentation for twitterpunch-0.0.4
Installing ri documentation for twitterpunch-0.0.4
5 gems installed
[ben@ganymede] ~ $
```

The first thing you'll notice is the giant Rubygame warning. There's a small
typo in one of the libraries it uses. We'll need to fix that before we use
Twitterpunch. First, we'll verify the file and path:

```
[ben@ganymede] ~ $ mdfind -name mac.rb -onlyin /Library
/Library/Ruby/Gems/2.0.0/gems/ruby-sdl-ffi-0.4/lib/ruby-sdl-ffi/sdl/mac.rb
```

Edit that `mac.rb` file with your favorite text editor, or use
[the patch](https://github.com/xrs1133/ruby-sdl-ffi/commit/0b721ac4659b4c08cda5aa2f418561a8a311e85b.patch)
directly if you're comfortable with that. Find line `161` and change it from:

``` ruby
callback :imp, [:id, :sel, :varargs], :id
```

to:

```
callback :imp, [:id, :sel, :ivar], :id
```

The final library we need installed is the native SDL library that Rubygame uses
for its screen drawing. If you've got [Homebrew](http://brew.sh/) installed, this
is a trivial task with `brew install sdl`. Otherwise, you can follow the
[installation instructions](https://github.com/rubygame/rubygame/wiki/Install)
for your platform of choice.

## Configuration:

That was the easy part. Now we need to configure Twitterpunch with permissions to post to Twitter.

```
[ben@ganymede] ~ $ twitterpunch --authorize
Please authorize Twitterpunch to post to your Twitter account.
Visit https://api.twitter.com//oauth/authorize?oauth_token=KVK2gSdmL6XxTiBAY3e94wwU64v1r4zc in your browser.
Please enter the PIN you are given: 2307049
Please edit /Users/ben/.twitterpunch.yaml to configure.
[ben@ganymede] ~ $
```

![Twitter auth]({{ site.baseurl }}/assets/images/twitter_auth_1.png){:.rightside}

If you're on OS X, it will automatically open your browser to the proper URI. If
you're on another platform, just copy & paste it into your browser. Ensure that
you're logged in to the Twitter account you want the photos to be posted as.
This does not have to be the same account that you used to create your Twitter
Application above. I made a new novelty account just for this purpose, myself.

![Twitter auth]({{ site.baseurl }}/assets/images/twitter_auth_2.png){:.leftside}

You will see the name and information of the Twitter Application you created.
Once you have granted permission, you'll see a PIN number displayed. Copy and
paste that to answer the PIN prompt from Twitterpunch.

Twitterpunch will write out a starter configuration file and give you the path so that you can customize it further.

``` yaml
---
:messages:
- Hello there
- I'm a posting fool
- minimally viable product
:viewer:
  :count: 5
:hashtag: Twitterpunch
:photodir: ~/Pictures/twitterpunch/
:logfile: ~/.twitterpunch.log
:twitter:
  :consumer_key: hjHFe3KDJbWYckWodN7LoxZMQ
  :consumer_secret: 2idxT6YGMkmCWVdb3nRgmGnGqm9TG4kIsN6BIPX4UCLNEJ2887
  :access_token: 2852350302-0Sxa1fCW3RBCdWeDVUeqmzZtx1dYrpiqRxXOtMe
  :access_token_secret: OP8ocnQcArPXK4M3tsRnbw4OIWvtSm0ULeCP4kGu4NDp2
```

Edit that file with the text editor of your choice. Make sure that you maintain
consistent syntax, or the parser will shout at you and Twitterpunch won't run
properly. When you're done, copy this file to both computers you're using.

* The `:messages` key is a list of messages that Twitterpunch will randomly
  choose from when posting photos. Add as many as you like.
* The `:viewer` key enables the built in slideshow viewer. Delete it and the
  `:count` subkey if you want to use something else.
* The `:count` subkey (notice the indentation) configures the number of images
  to have onscreen at once. You might want to lower this if you get jerky
  movement on an older or slower machine.
* The `:hashtag` key is the hashtag that Twitterpunch will post to and stream from.
* The `:photodir` key is where Twitterpunch will save the photos that it streams.
  It will attempt to create the directory if it doesn't exist.
* Twitterpunch will log the tweets that come in and who they're from in the `:logfile`.
* You should not need to change the `:twitter` keys. They're generated in the `--genconfig` step.

## Set up the Photo Booth itself:

Almost done, and this step is super easy! I'll assume at this step that you're
going to use the built in Photo Booth app. Make sure that you've run Photo Booth
at least once to create the library it uses to save photos and then install the
Twitterpuch workflow onto the machine running the photo booth.

```
[ben@ganymede] ~ $ twitterpunch --install
[ben@ganymede] ~ $
```

![Folder action setup]({{ site.baseurl }}/assets/images/folder_action.png)

This will use OS X's built in Folder Actions capability. It will install a
workflow and attach that to the folder that Photo Booth saves its photos to.
Choose the Install button from the popup dialog. If it doesn't work for some
reason, follow the [troubleshooting steps](https://github.com/binford2k/twitterpunch#troubleshooting)
on the Github page.

## Using Twitterpunch:

Now it's time for fun! Like anything, you should test it out first. On the
display machine, run Twitterpunch in streaming mode.

```
[ben@wyatt] ~ $ twitterpunch --stream
```

Assuming that you're using the built in slideshow viewer, the screen will go
black and you'll see a cascading slideshow of all the photos in the `:photodir`,
configured as `~/Pictures/twitterpunch` by default. As new tweets to your hashtag
are posted, they'll be downloaded to that directory and displayed. Test it now
by posting a tweet from your own account and including your hashtag. You should
hear your tweet spoken aloud and if you attached a photo it zoom to front and
center for about 20 seconds or so.

Move over to the photo booth computer and fire up the Photo Booth application.
Make sure you're wearing pants and click the Take Picture camera button. A few
seconds later, you'll hear the Twitter chirp as the photo is posted and in
another second or two, depending on network speed, the photo will show up on the
display computer. Because it came from Twitterpunch itself, it won't be spoken
aloud. Press ESC to exit the viewer.

All done. Have fun!

-----------

## Alternative configurations:
I've designed Twitterpunch to work as described, but it's also flexible enough to be used in a variety of ways.

### Photo Booth alternatives:

If you'd like to use something besides Photo Booth to take your photos, or if
you're on another platform, Twitterpunch will post photos passed to it on the
command line. Configure whatever you're using to simply execute Twitterpunch
each time it takes a photo. On OS X, you can also attach the Twitterpunch
workflow to any folder you'd like and photo files saved to that directory will
be automatically posted.

```
[ben@ganymede] ~ $ twitterpunch snapshot-filename.jpg
[ben@ganymede] ~ $
```

### Display alternatives:

The Twitterpunch viewer should work on any platform with SDL and Rubygame
support. If you don't like the way it looks or works though, you can disable
that functionality by deleting the :viewer key from the configuration file. Here
are a couple alternatives you can try:

#### Windows background image:
* Configure the Windows background to randomly cycle through photos in the :photodir.
* Hide desktop icons.
* Hide the taskbar.
* Disable screensaver and power savings.
* *Drawbacks:* You're using Windows and you have to install Ruby & RubyGems manually.
#### OS X screensaver:
* Choose one of the sexy screensavers and configure it to show photos from the :photodir.
* Set screensaver to a super short timeout.
* Disable power savings.
* *Drawbacks:* The screensaver doesn't reload dynamically, so I have to kick it and you'll see it reloading each time a new tweet comes in.

### Installing on Windows:

Unsurprisingly, the Windows platform is a pain in the ass to work with. You'll need to manually install several things.

1. Install the Ruby and RubyGems environment:
    * [http://rubyinstaller.org/downloads/](http://rubyinstaller.org/downloads/)
    * Install both Ruby and the Ruby DevKit
1. Install the SDL library
    * [https://github.com/rubygame/rubygame/wiki/Windows-Install-Guide](https://github.com/rubygame/rubygame/wiki/Windows-Install-Guide)
    * Follow the instructions here to install SDL.
1. Install Twitterpunch and all dependencies
    * `gem install twitterpunch`
1. Fix the OpenSSL CA certificate
    * Use the instructions at [https://gist.github.com/fnichol/867550](https://gist.github.com/fnichol/867550)
      to save `cacert.pem` to your Ruby installation directory and then set an environment variable pointing to it.
    * Twitterpunch will mostly work properly without this fix, but the streaming
      viewer won't be able to distinguish between posts from Twitterpunch and posts
      from other people, so it will speak aloud all tweets, including the ones
      using the configured messages.
