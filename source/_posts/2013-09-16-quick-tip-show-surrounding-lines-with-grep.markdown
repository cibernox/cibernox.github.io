---
layout: post
title: "Quick tip: Show surrounding lines with grep"
date: 2013-09-16 22:23
comments: true
comments: true
published: true
categories: [tip,unix,development]
keywords: tip,trick,grep,log,debug
description: "A quick tip, show the surrounding context of any grep match. Specially usefull to find error traces in your log"
---

A few days ago I made one of these small discoveries that make you smile and at the same time cry for all the time you have lost.
I was trying to debug an error in production. An ajax call was failing randomly (aparently) with a 500 but I couldn't figure out how to reproduce it,
so my plan was to navigate around the page until I can understand what kind of parameters make the ajax call fail.

The fastest way to see that is look at the log.

{% codeblock %}
  tail -f logs/production.log
{% endcodeblock %}

Fail!

The aplication has a pooling service that pollutes the log with a lot of requests that doesn't matter to me and makes impossible to find anything.

So I piped the output of the tail command to grep

{% codeblock %}
  tail -f logs/production.log | grep "500 Internal Server Error"
{% endcodeblock %}

Fail again. I see all the errors but I don't see the the context, so I don't know what action fails of what parameters had the request.

But unix always surprises me.

{% codeblock %}
NAME
       grep, egrep, fgrep - print lines matching a pattern

SYNOPSIS
       grep [options] PATTERN [FILE...]
       grep [options] [-e PATTERN | -f FILE] [FILE...]

DESCRIPTION
       Grep searches the named input FILEs (or standard input if no files are named, or the file name - is given) for lines containing a match to the given PAT-
       TERN.  By default, grep prints the matching lines.

       In addition, two variant programs egrep and fgrep are available.  Egrep is the same as grep -E.  Fgrep is the same as grep -F.

OPTIONS
       -A NUM, --after-context=NUM
              Print NUM lines of trailing context after matching lines.  Places a line containing -- between contiguous groups of matches.

       -a, --text
              Process a binary file as if it were text; this is equivalent to the --binary-files=text option.

       -B NUM, --before-context=NUM
              Print NUM lines of leading context before matching lines.  Places a line containing -- between contiguous groups of matches.

       -C NUM, --context=NUM
              Print NUM lines of output context.  Places a line containing -- between contiguous groups of matches.
{% endcodeblock %}

There is much more options, but the important options here are `-A`, `-B` and `-C`. With this options you can show the context around the grep matches.

{% codeblock %}
  tail -f logs/production.log | grep "500 Internal Server Error" -B 2 -A 5
{% endcodeblock %}

That command shows 2 lines before and 5 after the matching.

It worked like a charm!