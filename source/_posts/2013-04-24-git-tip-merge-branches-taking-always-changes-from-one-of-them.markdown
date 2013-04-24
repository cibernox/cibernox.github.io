---
layout: post
title: "Git tip: Merge branches taking always changes from one of them"
date: 2013-04-24 02:56
comments: true
published: true
categories: [tips,git]
keywords: tip,trick,command,git,merge,pull,recursive,strategy,theirs,ours
description: How to merge two branches and resolve the conflicts taking always the changes of one branch
---

This is a trick I discovered a few days ago and made me cry remembering the time I lost fixing manually
conflics when I already knew that the changes I wanted were all from same branch.

Never again using merge strategies.

{% codeblock %}
git merge [-s recursive] -X[theirs|ours]
{% endcodeblock %}

If you, being in the branch **master**, run `git merge -Xtheirs experimental_feature` the conflics will
be automatically resolved taking the changes from the **experimental_feature** branch.
The opposite, `git merge -Xours experimental_feature`, will keep the code from the current branch.

The `-s recursive` forces the merging strategy to the _recursive_ mode, which is the only strategy that
accepts the **theirs** and **ours** options. I did not know there where different strategies for
merge branches, but there are several. This is the default strategy when pulling or mergin _one_
branch into another, so most of the time won't have to specify this but is good to know. _(did you even
know that you can merge more than two branches at once?)_

Hope it helps.

Happy merging.
