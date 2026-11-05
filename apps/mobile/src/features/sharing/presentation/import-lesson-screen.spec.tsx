import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { ServicesProvider } from "../../../composition/app-services";
import { fakeServices } from "../../../testing/fake-services";
import { lessonFixture } from "../../../testing/fixtures";
import { encodeLessonLink } from "../domain/lesson-share-codec";
import { ImportLessonScreen } from "./import-lesson-screen";

const link = encodeLessonLink(lessonFixture());

async function setup(code?: string) {
  const fake = fakeServices();
  const onImported = jest.fn();
  await render(
    <ServicesProvider services={fake.services}>
      <ImportLessonScreen {...(code ? { code } : {})} onImported={onImported} />
    </ServicesProvider>,
  );
  return { ...fake, onImported };
}

describe("ImportLessonScreen", () => {
  it("bağlantıdan gelen dersi önizler ve yeni kimlikle kaydeder", async () => {
    const { repository, onImported } = await setup(link.split("d=")[1]);
    expect(screen.getByText("Sabah")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Derslerime ekle" }));
    await waitFor(() => expect(onImported).toHaveBeenCalledWith("id-1"));
    const saved = await repository.get("id-1");
    expect(saved?.pairs).toHaveLength(2);
    expect(saved?.groupId).toBeNull();
  });

  it("yapıştırılan bağlantıyı kabul eder", async () => {
    await setup();
    expect(screen.queryByRole("button", { name: "Derslerime ekle" })).toBeNull();
    await fireEvent.changeText(screen.getByLabelText("Paylaşım bağlantısı"), link);
    expect(screen.getByText("Sabah")).toBeTruthy();
  });

  it("geçersiz bağlantıda uyarır ve kaydetmeye izin vermez", async () => {
    await setup("bozuk!!");
    expect(screen.getByText("Bu bağlantı geçersiz veya bozuk.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Derslerime ekle" })).toBeNull();
  });

  it("kayıt hatasını gösterir", async () => {
    const { repository, onImported } = await setup(link);
    jest.spyOn(repository, "save").mockRejectedValue(new Error("disk"));
    await fireEvent.press(screen.getByRole("button", { name: "Derslerime ekle" }));
    await waitFor(() => expect(screen.getByText("Ders kaydedilemedi.")).toBeTruthy());
    expect(onImported).not.toHaveBeenCalled();
  });
});
