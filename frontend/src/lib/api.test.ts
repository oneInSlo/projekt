import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest"
import { apiFetch, createSalon, getSalonRegions } from "./api"

let fetchMock: Mock<typeof fetch>

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })

beforeEach(() => {
  fetchMock = vi.fn<typeof fetch>()
  vi.stubGlobal("fetch", fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("apiFetch", () => {
  it("sends JSON headers, credentials and the bearer token", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }))

    const data = await apiFetch<{ ok: boolean }>("/test", { accessToken: "abc" })

    expect(data).toEqual({ ok: true })
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toMatch(/\/test$/)
    expect(init?.credentials).toBe("include")
    expect(init?.headers).toMatchObject({
      "Content-Type": "application/json",
      Authorization: "Bearer abc",
    })
  })

  it("omits the Authorization header without a token", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}))

    await apiFetch("/test")

    const [, init] = fetchMock.mock.calls[0]
    expect(init?.headers).not.toHaveProperty("Authorization")
  })

  it("does not set Content-Type for FormData bodies", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}))

    await apiFetch("/upload", { method: "POST", body: new FormData() })

    const [, init] = fetchMock.mock.calls[0]
    expect(init?.headers).not.toHaveProperty("Content-Type")
  })

  it("throws the error message returned by the server", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "Email already exists" }, 409))

    await expect(apiFetch("/users/register")).rejects.toThrow("Email already exists")
  })

  it("falls back to a generic message when the response is not JSON", async () => {
    fetchMock.mockResolvedValue(new Response("<html>Error</html>", { status: 500 }))

    await expect(apiFetch("/salons/create-salon")).rejects.toThrow("Request failed (500)")
  })

  it("dispatches a session-expired event when the access token has expired", async () => {
    const target = new EventTarget()
    const listener = vi.fn()
    target.addEventListener("nailbabe:session-expired", listener)
    vi.stubGlobal("window", target)
    fetchMock.mockResolvedValue(jsonResponse({ message: "Token has expired. Please login again." }, 403))

    await expect(apiFetch("/salons/my-salon")).rejects.toThrow()

    expect(listener).toHaveBeenCalledOnce()
  })

  it("does not dispatch session-expired for other 403 errors", async () => {
    const target = new EventTarget()
    const listener = vi.fn()
    target.addEventListener("nailbabe:session-expired", listener)
    vi.stubGlobal("window", target)
    fetchMock.mockResolvedValue(jsonResponse({ message: "Only salon managers can create a salon" }, 403))

    await expect(apiFetch("/salons/create-salon")).rejects.toThrow("Only salon managers can create a salon")

    expect(listener).not.toHaveBeenCalled()
  })
})

describe("salon API helpers", () => {
  it("createSalon sends all fields and the image as multipart form data", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "Salon created", salon: { id: "s1" } }, 201))
    const image = new File(["image"], "salon.png", { type: "image/png" })

    await createSalon(
      {
        name: "Nail Studio",
        description: "Opis",
        category_id: 2,
        region_id: 1,
        address: "Glavna 1",
        city: "Maribor",
        postal_code: "2000",
        phone: "041000000",
        email: "salon@example.com",
        instagram: "@nailstudio",
        image,
      },
      "token"
    )

    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toMatch(/\/salons\/create-salon$/)
    expect(init?.method).toBe("POST")
    const body = init?.body as FormData
    expect(body.get("name")).toBe("Nail Studio")
    expect(body.get("category_id")).toBe("2")
    expect(body.get("image")).toBeInstanceOf(File)
  })

  it("getSalonRegions requests the public regions endpoint", async () => {
    const regions = [{ id: 1, name: "Podravska" }]
    fetchMock.mockResolvedValue(jsonResponse({ regions }))

    const data = await getSalonRegions()

    expect(data.regions).toEqual(regions)
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toMatch(/\/salons\/regions$/)
    expect(init?.headers).not.toHaveProperty("Authorization")
  })
})
