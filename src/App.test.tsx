import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

describe("App", () => {
  it("renders the dashboard and navigates via hash links", async () => {
    window.location.hash = "";
    render(<App />);
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");

    await userEvent.click(screen.getByRole("link", { name: "Teams" }));
    expect(window.location.hash).toBe("#/teams");
    await act(async () => {});
    expect(screen.getByRole("link", { name: "Teams" })).toHaveAttribute("aria-current", "page");
    expect(document.title).toMatch(/^Teams/);
  });
});
