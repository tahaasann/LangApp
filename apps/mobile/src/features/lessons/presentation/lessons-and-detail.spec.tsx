import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import { ServicesProvider } from "../../../composition/app-services";
import { fakeServices } from "../../../testing/fake-services";
import { lessonFixture } from "../../../testing/fixtures";
import { mapPairsToSpans } from "../../alignment/domain/map-pairs-to-spans";
import { decodeLessonLink } from "../../sharing/domain/lesson-share-codec";
import { LessonDetailScreen } from "./lesson-detail-screen";
import { LessonsScreen } from "./lessons-screen";

const button = (name: string | RegExp) => screen.getByRole("button", { name });

describe("LessonsScreen", () => {
  async function setup(refreshKey = 0) {
    const fake = fakeServices();
    const onOpen = jest.fn();
    const onImport = jest.fn();
    const ui = (key: number) => (
      <ServicesProvider services={fake.services}>
        <LessonsScreen refreshKey={key} onOpen={onOpen} onImport={onImport} />
      </ServicesProvider>
    );
    return { ...fake, onOpen, onImport, ui, refreshKey };
  }

  it("boş durumu gösterir", async () => {
    const { ui } = await setup();
    await render(ui(0));
    await waitFor(() => expect(screen.getByText(/Henüz ders yok/)).toBeTruthy());
  });

  it("dersleri listeler ve açar", async () => {
    const { ui, repository, onOpen } = await setup();
    await repository.save(lessonFixture());
    await render(ui(0));
    await waitFor(() => expect(screen.getByText("Sabah")).toBeTruthy());
    expect(screen.getByText(/English → Türkçe · 2 çift/)).toBeTruthy();
    await fireEvent.press(screen.getByText("Sabah"));
    expect(onOpen).toHaveBeenCalledWith("lesson-1");
  });

  it("odak değişince yeniden yükler", async () => {
    const { ui, repository } = await setup();
    const view = await render(ui(0));
    await waitFor(() => expect(screen.getByText(/Henüz ders yok/)).toBeTruthy());
    await repository.save(lessonFixture());
    await view.rerender(ui(1));
    await waitFor(() => expect(screen.getByText("Sabah")).toBeTruthy());
  });

  it("grup ekler, filtreler ve siler", async () => {
    const { ui, repository } = await setup();
    await repository.saveGroup({ id: "g", name: "Seyahat" });
    await repository.save(lessonFixture({ groupId: "g" }));
    await repository.save(lessonFixture({ id: "other", title: "Diğer" }));
    await render(ui(0));
    await waitFor(() => expect(screen.getByText("Diğer")).toBeTruthy());

    await fireEvent.press(button("Seyahat"));
    expect(screen.queryByText("Diğer")).toBeNull();
    expect(screen.getByText("Sabah")).toBeTruthy();

    await fireEvent.press(button("Bu grubu sil"));
    await waitFor(() => expect(screen.getByText("Diğer")).toBeTruthy());
    expect((await repository.get("lesson-1"))?.groupId).toBeNull();

    expect(button("Grup ekle")).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("Yeni grup"), " Araba ");
    await fireEvent.press(button("Grup ekle"));
    await waitFor(() => expect(button("Araba")).toBeTruthy());
    expect(screen.getByLabelText("Yeni grup").props.value).toBe("");
  });

  it("yükleme hatasını gösterir", async () => {
    const { ui, repository } = await setup();
    jest.spyOn(repository, "list").mockRejectedValue(new Error("db"));
    await render(ui(0));
    await waitFor(() => expect(screen.getByText("Dersler yüklenemedi.")).toBeTruthy());
  });

  it("içe aktarma ekranını açar", async () => {
    const { ui, onImport } = await setup();
    await render(ui(0));
    await fireEvent.press(button("Bağlantıyla ders al"));
    expect(onImport).toHaveBeenCalled();
  });
});

describe("LessonDetailScreen", () => {
  async function setup(lesson = lessonFixture()) {
    const fake = fakeServices();
    const onDeleted = jest.fn();
    await fake.repository.save(lesson);
    await render(
      <ServicesProvider services={fake.services}>
        <LessonDetailScreen lessonId={lesson.id} onDeleted={onDeleted} />
      </ServicesProvider>,
    );
    await waitFor(() => expect(screen.getByText(lesson.title)).toBeTruthy());
    return { ...fake, onDeleted };
  }

  it("olmayan ders için mesaj gösterir", async () => {
    const fake = fakeServices();
    await render(
      <ServicesProvider services={fake.services}>
        <LessonDetailScreen lessonId="yok" onDeleted={jest.fn()} />
      </ServicesProvider>,
    );
    await waitFor(() => expect(screen.getByText("Bu ders bulunamadı.")).toBeTruthy());
  });

  it("iki taraftaki ifadeye dokununca aynı kaynak ifadeyi okur", async () => {
    const { speech } = await setup();
    await fireEvent.press(screen.getByText("Good"));
    await fireEvent.press(screen.getByText("Gün"));
    expect(speech.speak).toHaveBeenCalledTimes(2);
    expect(speech.speak).toHaveBeenNthCalledWith(1, "Good", "en");
    expect(speech.speak).toHaveBeenNthCalledWith(2, "Good", "en");
  });

  it("tüm metni okur", async () => {
    const { speech } = await setup();
    await fireEvent.press(button("Tümünü dinle"));
    expect(speech.speak).toHaveBeenCalledWith("Good morning", "en");
  });

  it("düzenlemede çift silip kaydeder", async () => {
    const { repository } = await setup();
    await fireEvent.press(button("Eşleştirmeyi düzenle"));
    await fireEvent.press(screen.getByText("Good"));
    await fireEvent.press(button("Çifti sil"));
    await fireEvent.press(button("Değişiklikleri kaydet"));
    await waitFor(() => expect(button("Eşleştirmeyi düzenle")).toBeTruthy());
    expect((await repository.get("lesson-1"))?.pairs).toHaveLength(1);
  });

  it("noktalaması komşu çifte ait kelime silindikten sonra yeniden eşleştirilir", async () => {
    const sourceText = "coffee, please";
    const targetText = "kahve lütfen";
    const { repository } = await setup(
      lessonFixture({
        sourceText,
        targetText,
        pairs: mapPairsToSpans({
          sourceText,
          targetText,
          pairs: [
            { order: 0, source: "coffee", target: "kahve" },
            { order: 1, source: ", please", target: "lütfen" },
          ],
        }),
      }),
    );
    await fireEvent.press(button("Eşleştirmeyi düzenle"));
    await fireEvent.press(screen.getByText("coffee"));
    await fireEvent.press(button("Çifti sil"));

    await fireEvent.press(screen.getByText("coffee"));
    await fireEvent.press(screen.getByText("kahve"));
    await fireEvent.press(button("Seçimi eşleştir"));
    await fireEvent.press(button("Değişiklikleri kaydet"));
    await waitFor(() => expect(button("Eşleştirmeyi düzenle")).toBeTruthy());
    expect((await repository.get("lesson-1"))?.pairs.map((pair) => pair.source.text)).toEqual(["coffee", ", please"]);
  });

  it("vazgeçince değişikliği atar", async () => {
    const { repository } = await setup();
    await fireEvent.press(button("Eşleştirmeyi düzenle"));
    await fireEvent.press(screen.getByText("Good"));
    await fireEvent.press(button("Çifti sil"));
    await fireEvent.press(button("Vazgeç"));
    expect(screen.getByText("Good")).toBeTruthy();
    expect((await repository.get("lesson-1"))?.pairs).toHaveLength(2);
  });

  it("kayıt hatasında düzenlemede kalır", async () => {
    const { repository } = await setup();
    await fireEvent.press(button("Eşleştirmeyi düzenle"));
    jest.spyOn(repository, "save").mockRejectedValue(new Error("disk"));
    await fireEvent.press(button("Değişiklikleri kaydet"));
    await waitFor(() => expect(screen.getByText("Değişiklik kaydedilemedi.")).toBeTruthy());
    expect(button("Değişiklikleri kaydet")).toBeTruthy();
  });

  it("dersi gruba taşır", async () => {
    const fake = fakeServices();
    await fake.repository.save(lessonFixture());
    await fake.repository.saveGroup({ id: "g", name: "Seyahat" });
    await render(
      <ServicesProvider services={fake.services}>
        <LessonDetailScreen lessonId="lesson-1" onDeleted={jest.fn()} />
      </ServicesProvider>,
    );
    await waitFor(() => expect(button("Seyahat")).toBeTruthy());
    await fireEvent.press(button("Seyahat"));
    await waitFor(async () => expect((await fake.repository.get("lesson-1"))?.groupId).toBe("g"));
  });

  it("çözülebilir bağlantıyla paylaşır", async () => {
    const { shareText } = await setup();
    await fireEvent.press(button("Paylaş"));
    await waitFor(() => expect(shareText).toHaveBeenCalled());
    const message = shareText.mock.calls[0]?.[0] ?? "";
    const link = message.split("\n")[1] ?? "";
    expect(decodeLessonLink(link)?.sourceText).toBe("Good morning");
  });

  it("onay sonrası siler, vazgeçince silmez", async () => {
    const { repository, onDeleted } = await setup();
    const alert = jest.spyOn(Alert, "alert");
    await fireEvent.press(button("Dersi sil"));
    expect(await repository.get("lesson-1")).not.toBeNull();
    const actions = alert.mock.calls[0]?.[2] ?? [];
    actions.find((action) => action.text === "Sil")?.onPress?.();
    await waitFor(() => expect(onDeleted).toHaveBeenCalled());
    expect(await repository.get("lesson-1")).toBeNull();
  });

  it("ayrılınca sesi durdurur", async () => {
    const fake = fakeServices();
    await fake.repository.save(lessonFixture());
    const view = await render(
      <ServicesProvider services={fake.services}>
        <LessonDetailScreen lessonId="lesson-1" onDeleted={jest.fn()} />
      </ServicesProvider>,
    );
    await waitFor(() => expect(screen.getByText("Sabah")).toBeTruthy());
    await view.unmount();
    expect(fake.speech.stop).toHaveBeenCalled();
  });
});
