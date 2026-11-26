"""Browser smoke test against the deployed app files and synthetic HTTP fixtures."""
from base64 import b64decode
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.parse import urlencode

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
PIXEL = b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lKcAAAAASUVORK5CYII=")
SLOTS = {f"objective-first-b2-u04-l0{i}": f"U4.{i}" for i in (1, 2)}


def run(browser, origin):
    publications = {}
    for slot, code in SLOTS.items():
        draft_id = "qa-draft-" + code[-1]
        title = code + " Course QA"
        draft = {
            "id": draft_id, "status": "draft", "title": title, "lessonNumber": code,
            "courseProfileId": "objective-first-b2", "courseLabel": "Objective First B2",
            "screens": [{"id": "qa-screen", "title": title, "stage": "Practice",
                         "layout": "standard", "blocks": []}],
        }
        context = browser.new_context(service_workers="block")
        page = context.new_page()
        role = "admin"

        def api(route):
            nonlocal role
            request = route.request
            url = request.url.removeprefix(origin)
            query = request.url
            denied = {"ok": False, "error": "Authentication required"}
            if url.startswith("/api/auth/me"):
                if not role:
                    return route.fulfill(status=401, json=denied)
                return route.fulfill(json={"ok": True, "user": {
                    "role": role, "user_id": "synthetic-" + role, "display_name": "Course QA"
                }})
            if url.startswith("/api/auth/student"):
                if request.method == "POST":
                    role = "student"
                if role != "student":
                    return route.fulfill(status=401, json=denied)
                return route.fulfill(json={"ok": True, "user": {
                    "role": role, "student_id": "TEST002", "display_name": "Course QA"
                }, "memberships": [{"course_id": "objective-first-b2", "status": "active"}]})
            if url.startswith("/api/authoring/lessons"):
                return route.fulfill(json={"ok": True, "draft": draft, "revision": 1, "drafts": []})
            if url.startswith("/api/authoring/publish-course"):
                if request.method == "POST":
                    payload = request.post_data_json
                    if payload.get("action") == "check":
                        assert role == "student" and payload["shellId"] == slot
                        assert payload["blockId"] == "qa-question"
                        assert payload["values"] == {"0": "1"}
                        return route.fulfill(json={"ok": True, "score": {
                            "correctCount": 1, "answeredCount": 1, "totalCount": 1
                        }})
                    assert role == "admin" and payload == {
                        "draftId": draft_id, "revision": 1, "shellId": slot
                    }
                    publications[slot] = title
                    return route.fulfill(json={"ok": True, "shellId": slot})
                assert role == "student" and slot in publications
                if "summary=1" in query:
                    return route.fulfill(json={"ok": True, "publication": {
                        "shell_id": slot, "title": title
                    }})
                if "image=qa-image" in query:
                    return route.fulfill(body=PIXEL, content_type="image/png")
                image = "/api/authoring/publish-course?" + urlencode({"shellId": slot, "image": "qa-image"})
                return route.fulfill(json={"ok": True, "lesson": {
                    "lessonNumber": code, "title": title,
                    "screens": [{"title": "Practice", "instruction": "Choose an answer.", "steps": [],
                                 "blocks": [{"type": "image", "src": image, "alt": "QA image"},
                                            {"id": "qa-question", "type": "activity", "checkable": True,
                                             "prompt": "Choose an answer", "rows": [{"id": "0", "prompt": "",
                                                 "options": [{"id": "0", "label": "First"}, {"id": "1", "label": "Second"}]}]}]}]
                }})
            return route.fulfill(json={"ok": True, "files": [], "configured": False})

        context.route(origin + "/api/**", api)
        page.goto(origin + "/studio/?serverDraft=" + draft_id, wait_until="domcontentloaded")
        page.get_by_role("button", name="Publish candidate", exact=True).click()
        expect(page.get_by_text("Course B2 publication saved.", exact=True)).to_be_visible()

        role = None
        page.goto(origin + "/signin.html?next=%2Findex.html", wait_until="domcontentloaded")
        page.get_by_role("button", name="Student", exact=True).click()
        page.locator("#studentId").fill("TEST001")
        page.locator("#pin").fill("123456")
        page.locator("#studentForm button[type=submit]").click()
        page.get_by_role("button", name="Objectives B2", exact=False).click()
        page.get_by_role("button", name="Unit 4 published", exact=False).click()
        page.get_by_role("button", name=code + " · Lesson", exact=False).click()
        page.get_by_role("link", name=title, exact=True).click()
        page.get_by_role("heading", name=code + " · " + title, exact=True).wait_for()
        page.wait_for_function("document.querySelector('img[alt=\"QA image\"]')?.naturalWidth === 1")
        page.get_by_role("combobox", name="Choose an answer", exact=True).select_option("1")
        page.get_by_role("button", name="Check", exact=True).click()
        expect(page.get_by_role("status")).to_have_text("1/1 correct · 100%")
        context.close()
        print(f"{code}: Publish, student sign-in, Courses, image and Check passed (synthetic API)")


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(SimpleHTTPRequestHandler, directory=ROOT))
    Thread(target=server.serve_forever, daemon=True).start()
    try:
        with sync_playwright() as playwright:
            with playwright.chromium.launch() as browser:
                run(browser, f"http://127.0.0.1:{server.server_port}")
    finally:
        server.shutdown()
