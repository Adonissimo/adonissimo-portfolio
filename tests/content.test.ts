import { test } from 'node:test';
import assert from 'node:assert/strict';
import { projects, getProject, filterProjects, safeHttps, emailHref } from '../lib/content.ts';
import { validTheme } from '../lib/theme.ts';

test('published content has unique URL-safe slugs and no fictional demo links', () => {
  const slugs = projects.map(project => project.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const project of projects) {
    assert.match(project.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    if (project.status === 'planned') {
      assert.equal(project.liveUrl, undefined);
      assert.equal(project.sourceUrl, undefined);
      assert.equal(getProject(project.slug), undefined);
    } else {
      assert.ok(project.overview && project.challenge && project.approach.length && project.outcome);
      assert.equal(getProject(project.slug), project);
    }
  }
  assert.equal(getProject('missing-quest'), undefined);
});

test('project filters produce the expected subsets without changing the journal', () => {
  const original = projects.map(project => project.slug);
  assert.equal(filterProjects(projects, 'all'), projects);
  assert.ok(filterProjects(projects, 'built').every(project => project.status === 'built'));
  assert.ok(filterProjects(projects, 'planned').every(project => project.status === 'planned'));
  assert.equal(filterProjects(projects, 'built').length + filterProjects(projects, 'planned').length, projects.length);
  assert.deepEqual(projects.map(project => project.slug), original);
  assert.deepEqual(filterProjects([], 'built'), []);
});

test('contact links reject executable protocols, credentials, and header injection', () => {
  assert.equal(safeHttps('https://github.com/example'), 'https://github.com/example');
  for (const input of ['', 'javascript:alert(1)', 'http://example.com', 'https://user:password@example.com', 'invalid']) assert.equal(safeHttps(input), undefined);
  assert.equal(emailHref('hello@example.com'), 'mailto:hello@example.com');
  for (const input of ['', 'not-an-email', 'hello@example.com?bcc=other@example.com', 'hello@example.com\r\nBcc:x@y.com', 'hello@example.com%0aBcc:x@y.com']) assert.equal(emailHref(input), undefined);
});

test('stored theme accepts only supported values', () => {
  assert.equal(validTheme('day'), true);
  assert.equal(validTheme('night'), true);
  for (const input of ['dark', '', null, undefined, false, {}]) assert.equal(validTheme(input), false);
});
