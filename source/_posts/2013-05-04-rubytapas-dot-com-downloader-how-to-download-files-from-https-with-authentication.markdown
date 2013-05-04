---
layout: post
title: "Rubytapas.com downloader. How to download files from https with authentication"
date: 2013-05-04 02:14
comments: true
categories: ruby
keywords: rubytapas,downloader,script,download,https,authentication,curl
description: "Script for download files from rubytapas.com, using curl with https and cookies"
---

A few days ago I susbcribed to [Rubytapas](http://www.rubytapas.com/), a series of short screencasts about ruby
by [Advi Grimm](http://devblog.avdi.org/).

First of all, I have to recommend you to give it a try. A constant source of small pills filled with ruby wisdom.
I've discovered many usefull tricks. It totally worths the 9$/month.

### The problem

After my subscription, I wanted to download the old episodes (a few days ago Avdi published the 100th episode)
but I didn't want to do it manually. I googled for a script but I didn't found any, so I decided to write one.

The problem I found was to download files from an **HTTPS** source that was behind a login form. My first
idea was to use a pure ruby solution like the `HTTParty` gem, but after a few failed attemps I realized that
`curl` had all that I need.

### The idea

I used Curl with SSL a few times, but always with public documents, not with files that was behind an authentication
form, but curl has built-in support for cookies.

To save a cookie you pass the **-c** option for specify the file where to save the cookie, and the **-d**
option for pass a query string with the authetication params.

{% codeblock %}
curl -c file_name_of_the_cookie.txt -d "username=example@mail.com&password=myPassword123" http://rubytapas.dpdcart.com/subscriber/login?__dpd_cart=8f511233-b72b-4a8c-8c37-fadc74fbc3a1
{% endcodeblock %}

After that you'll have the cookie saved in a file. Loading that cookie with the **-b** option you can
download files behind the authetication process.

{% codeblock %}
curl -o episode.mp4 -b cookie-file.txt -d "username=my-email@example.com&password=myPassword123" https://rubytapas.dpdcart.com/subscriber/download?file_id=446
{% endcodeblock %}

It works! It's time to make make the script.

### The solution

First of all we need to know how many episodes have been published and the files we want to download for each one.
If only there was a place from where to obtain the basic information that is published in a compact and organized way!
Oh, there is. The RSS!

The rss can be easily obtained with a get request. It requires basic authentication, but doesn't need to
set a cookie since there is no need to keep alive any session, so use your favorite http client. Mine is HTTParty,
_mainly because of its cool name_.

{% codeblock lang:ruby %}
rss = HTTParty.get(https://rubytapas.dpdcart.com/feed, basic_auth: { username: "my@email.com", password: "myPassword123" })
{% endcodeblock %}

The rss file is an XML file that can be parsed and inspected with [nokogiri](http://nokogiri.org/).
Each episode in the rss looks like this:

{% codeblock lang:xml %}
<item>
  <title><![CDATA[092 Coincidental Duplication Redux]]></title>
  <link>https://rubytapas.dpdcart.com/subscriber/post?id=185</link>
  <description><![CDATA[<div class="blog-entry">
      <div class="blog-content"><p>Katrina Owen contributed an example of coincidental duplication I liked so much I decided to make a second episode about it. Enjoy!</p>
      </div>
      <h3>Attached Files</h3>
      <ul>
      <li><a href="https://rubytapas.dpdcart.com/subscriber/download?file_id=445">092-coincidental-duplication-redux.html</a></li>
      <li><a href="https://rubytapas.dpdcart.com/subscriber/download?file_id=446">092-coincidental-duplication-redux.mp4</a></li>
      <li><a href="https://rubytapas.dpdcart.com/subscriber/download?file_id=447">092-coincidental-duplication-redux.rb</a></li>
      </ul></div>]]>
  </description>
  <guid isPermaLink="false">dpd-5b84a418456992f342a46fe896aa2835b09bd7f4</guid>
  <pubDate>Fri, 03 May 2013 09:00:00 -0400</pubDate>
  <enclosure url="https://rubytapas.dpdcart.com/feed/download/446/092-coincidental-duplication-redux.mp4" length="21645987" type="video/mp4"/>
  <itunes:subtitle>Another example of over-DRYing code</itunes:subtitle>
  <itunes:image href="https://getdpd.com/uploads/ruby-tapas.png"/>
</item>
{% endcodeblock %}

Each `<item></item>` is an episodes. Its title is inside a `<title></title>` and the `<description></desctiption>` contains some html
with one link for each file. The file's url is in the _href_ attribute and the name in the text of the link.

That was all I needed to know. Here is the script.

{% codeblock rubytapas_downloader.rb %}
require 'httparty'
require 'nokogiri'

USERNAME = "email-used@in-registration.com"
PASSWORD = "your-password-here"
COOKIE_FILE = 'cookies.txt' # by example

class RubytapasDownloader
  FEED_URL  = "https://rubytapas.dpdcart.com/feed"
  LOGIN_URL = "http://rubytapas.dpdcart.com/subscriber/login?__dpd_cart=8f511233-b72b-4a8c-8c37-fadc74fbc3a1"

  ##
  # Fetchs and parses the rss feed. Generates the episodes
  #
  def initialize
    rss = HTTParty.get(FEED_URL, basic_auth: { username: USERNAME, password: PASSWORD })
    @episodes = Nokogiri::XML(rss).css('item').map{ |item| Episode.new(item) }
  end

  ##
  # Downloads the new episodes with curl.
  #
  def launch
    puts "--- LAUNCHING RUBYTAPAS DOWNLOADER ---"

    puts "--- LOG IN AND SAVE COOKIE ---"
    login_and_save_cookie

    new_episodes = @episodes.reject(&:downloaded?)
    count = new_episodes.size
    puts "#{count} NEW EPISODES"


    new_episodes.each_with_index do |episode, index|
      puts "DOWNLOADING #{episode.title} (#{index + 1} of #{count})"
      episode.download!
    end

    puts "--- FINISHED RUBYTAPAS DOWNLOADER ---"
  rescue Exception => e
    puts "--- EXCEPTION RAISED WHILE DOWNLOADING --"
    puts e.inspect
  ensure
    File.delete(COOKIE_FILE) if File.exist?(COOKIE_FILE)
  end

private

  def login_and_save_cookie
    system %Q{curl -c #{COOKIE_FILE} -d "username=#{USERNAME}&password=#{PASSWORD}" #{LOGIN_URL}}
  end

end


class Episode
  attr_accessor :title, :files

  ##
  # Extracts informations from the parsed XML node
  #
  def initialize(parsed_rss_item)
    @title = parsed_rss_item.css('title').text.gsub(/\s|\W/, '-').gsub('--','-')
    @files = {}
    parsed_description = Nokogiri::XML(parsed_rss_item.css('description').text)
    parsed_description.css('a').each do |link|
      @files[link.text] = link[:href]
    end
  end

  ##
  # Simplest approach: If there is a folder named like the episode, it is already downloaded
  # TODO: Per-file checking instead of just a folder checking
  #
  def downloaded?
    Dir.exist?(title)
  end

  def download!
    Dir.mkdir(title)
    files.each do |filename, url|
      file_path = File.join(title, filename)
      system %Q{curl -o #{file_path} -b #{COOKIE_FILE} -d "username=#{USERNAME}&password=#{PASSWORD}" #{url}}
    end
  end
end

RubytapasDownloader.new.launch
{% endcodeblock %}


You can find the code up to date in my github: [https://github.com/cibernox/rubytapas_downloader](https://github.com/cibernox/rubytapas_downloader)

Happy hacking! ;)

