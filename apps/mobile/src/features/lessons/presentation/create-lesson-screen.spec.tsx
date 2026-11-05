import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { ServicesProvider } from "../../../composition/app-services";
import { fakeServices } from "../../../testing/fake-services";
import { AiGatewayError } from "../../alignment/domain/ai-gateway";
import { CreateLessonScreen } from "./create-lesson-screen";

async function setup() {
  const fake = fakeServices();
  const onSaved = jest.fn();
  await render(
    <ServicesProvider services={fake.services}>
      <CreateLessonScreen onSaved={onSaved} />
    </ServicesProvider>,
  );
  return { ...fake, onSaved };
}

const button = (name: string) => screen.getByRole("button", { name });
const typeTexts = async (source = "Good morning", target = "Gün aydın") => {
  await fireEvent.changeText(screen.getByLabelText("Öğrenilen dildeki metin"), source);
  await fireEvent.changeText(screen.getByLabelText("Ana dildeki karşılığı"), target);
};
const aligned = {
  pairs: [
    { order: 0, source: "Good", target: "Gün" },
    { order: 1, source: "morning", target: "aydın" },
  ],
};

describe("CreateLessonScreen", () => {
  it("metin girilmeden AI ve kaydet düğmeleri kapalıdır", async () => {
    await setup();
    expect(button("AI ile eşleştir")).toBeDisabled();
    expect(button("AI ile çevir")).toBeDisabled();
    expect(button("Dersi kaydet")).toBeDisabled();
    await fireEvent.press(button("Metni AI'a ürettir"));
    expect(button("AI ile üret")).toBeDisabled();
  });

  it("aynı dil seçilince uyarır ve işlemleri kapatır", async () => {
    await setup();
    await typeTexts();
    await fireEvent.press(screen.getAllByRole("button", { name: "Türkçe" })[0]!);
    expect(screen.getByText("Öğrenilen dil ve ana dil farklı olmalı.")).toBeTruthy();
    expect(button("AI ile eşleştir")).toBeDisabled();
    expect(button("Dersi kaydet")).toBeDisabled();
  });

  it("AI eşleştirince ifadeye dokunmak öğrenilen dilde okur", async () => {
    const { ai, speech } = await setup();
    ai.align.mockResolvedValue(aligned);
    await typeTexts();
    await fireEvent.press(button("AI ile eşleştir"));
    await waitFor(() => expect(screen.getByText("morning")).toBeTruthy());
    expect(ai.align).toHaveBeenCalledWith({
      learningLanguage: "en",
      nativeLanguage: "tr",
      level: "beginner",
      sourceText: "Good morning",
      targetText: "Gün aydın",
    });
    await fireEvent.press(screen.getByText("aydın"));
    expect(speech.speak).toHaveBeenCalledWith("morning", "en");
  });

  it("eşleştirme beklerken ilerleme gösterir ve düğmeleri kapatır", async () => {
    const { ai } = await setup();
    let finish: (value: typeof aligned) => void = () => undefined;
    ai.align.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    await typeTexts();
    // İşlem bitene kadar çözülmediği için press beklenmez.
    const pressed = fireEvent.press(button("AI ile eşleştir"));
    await waitFor(() => expect(screen.getByText(/Bu genelde 5–15 saniye sürer/)).toBeTruthy());
    expect(button("Dersi kaydet")).toBeDisabled();
    await act(async () => finish(aligned));
    await pressed;
    await waitFor(() => expect(screen.queryByText(/saniye sürer/)).toBeNull());
    expect(button("Dersi kaydet")).toBeEnabled();
  });

  it.each([
    ["ALIGNMENT_FAILED", /güvenilir şekilde eşleştiremedi/],
    ["NETWORK", /sunucusuna ulaşılamadı/],
    ["TIMEOUT", /çok uzun sürdü/],
    ["MODEL_REFUSED", /reddetti/],
  ] as const)("%s hatasını kullanıcıya açıklar", async (code, message) => {
    const { ai } = await setup();
    ai.align.mockRejectedValue(new AiGatewayError(code));
    await typeTexts();
    await fireEvent.press(button("AI ile eşleştir"));
    await waitFor(() => expect(screen.getByText(message)).toBeTruthy());
    expect(button("AI ile eşleştir")).toBeEnabled();
  });

  it("AI ile çevirince ana dil alanını doldurur", async () => {
    const { ai } = await setup();
    ai.translate.mockResolvedValue({ targetText: "Günaydın" });
    await fireEvent.changeText(screen.getByLabelText("Öğrenilen dildeki metin"), "Good morning");
    await fireEvent.press(button("AI ile çevir"));
    await waitFor(() => expect(screen.getByLabelText("Ana dildeki karşılığı").props.value).toBe("Günaydın"));
  });

  it("AI ile üretince konu ve uzunluğu yollar, iki metni doldurur", async () => {
    const { ai } = await setup();
    ai.generate.mockResolvedValue({ sourceText: "A coffee.", targetText: "Bir kahve." });
    await fireEvent.press(button("Metni AI'a ürettir"));
    await fireEvent.changeText(screen.getByLabelText("AI ile üret: konu"), "kahve");
    await fireEvent.press(button("Paragraf"));
    await fireEvent.press(button("AI ile üret"));
    await waitFor(() => expect(screen.getByLabelText("Öğrenilen dildeki metin").props.value).toBe("A coffee."));
    expect(screen.getByLabelText("Ana dildeki karşılığı").props.value).toBe("Bir kahve.");
    expect(ai.generate.mock.calls[0]?.[0]).toMatchObject({ topic: "kahve", length: "paragraph" });
  });

  it("metin değişince eşleştirmeyi temizler ve bildirir", async () => {
    const { ai } = await setup();
    ai.align.mockResolvedValue(aligned);
    await typeTexts();
    await fireEvent.press(button("AI ile eşleştir"));
    await waitFor(() => expect(screen.getByText("morning")).toBeTruthy());
    await fireEvent.changeText(screen.getByLabelText("Ana dildeki karşılığı"), "Günaydın");
    expect(screen.getByText("Metin değiştiği için eşleştirme temizlendi.")).toBeTruthy();
    expect(button("Çifti sil")).toBeDisabled();
  });

  it("elle eşleştirip kaydeder ve formu temizler", async () => {
    const { repository, onSaved } = await setup();
    await typeTexts();
    await fireEvent.press(screen.getByText("morning"));
    await fireEvent.press(screen.getByText("aydın"));
    await fireEvent.press(button("Seçimi eşleştir"));
    await fireEvent.press(button("Dersi kaydet"));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith("id-1"));
    const saved = await repository.get("id-1");
    expect(saved?.title).toBe("Good morning");
    expect(saved?.pairs[0]?.source.text).toBe("morning");
    expect(saved?.pairs[0]?.target.text).toBe("aydın");
    expect(screen.getByLabelText("Öğrenilen dildeki metin").props.value).toBe("");
  });

  it("seçilen ilk ve son kelime arasını tek ifade yapar", async () => {
    const { repository, onSaved } = await setup();
    await typeTexts("Good morning friend", "Gün");
    await fireEvent.press(screen.getByText("Good"));
    await fireEvent.press(screen.getByText("friend"));
    await fireEvent.press(screen.getByText("Gün"));
    await fireEvent.press(button("Seçimi eşleştir"));
    await fireEvent.press(button("Dersi kaydet"));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect((await repository.get("id-1"))?.pairs[0]?.source.text).toBe("Good morning friend");
  });

  it("metin değişince kelime seçimini sıfırlar", async () => {
    await setup();
    await typeTexts();
    await fireEvent.press(screen.getByText("morning"));
    await fireEvent.press(screen.getByText("aydın"));
    expect(button("Seçimi eşleştir")).toBeEnabled();
    await fireEvent.changeText(screen.getByLabelText("Öğrenilen dildeki metin"), "Hi");
    expect(button("Seçimi eşleştir")).toBeDisabled();
  });

  it("seçim mevcut çiftle çakışırsa hata gösterir", async () => {
    await setup();
    await typeTexts("one two three", "bir iki üç");
    await fireEvent.press(screen.getByText("two"));
    await fireEvent.press(screen.getByText("iki"));
    await fireEvent.press(button("Seçimi eşleştir"));

    // Aralık, arada kalan eşleşmiş "two" kelimesini de kapsar.
    await fireEvent.press(screen.getByText("one"));
    await fireEvent.press(screen.getByText("three"));
    await fireEvent.press(screen.getByText("bir"));
    await fireEvent.press(button("Seçimi eşleştir"));
    expect(screen.getByText("Seçim mevcut bir eşleşmeyle çakışıyor")).toBeTruthy();
  });

  it("çifti silince kelimeler yeniden seçilebilir olur", async () => {
    const { ai, onSaved, repository } = await setup();
    ai.align.mockResolvedValue(aligned);
    await typeTexts();
    await fireEvent.press(button("AI ile eşleştir"));
    await waitFor(() => expect(screen.getByText("morning")).toBeTruthy());
    expect(button("Çifti sil")).toBeDisabled();
    await fireEvent.press(screen.getByText("morning"));
    await fireEvent.press(button("Çifti sil"));
    await fireEvent.press(button("Dersi kaydet"));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect((await repository.get("id-1"))?.pairs).toHaveLength(1);
  });

  it("kaydetme hatasını gösterir ve metni korur", async () => {
    const { repository, onSaved } = await setup();
    jest.spyOn(repository, "save").mockRejectedValue(new Error("disk"));
    await typeTexts();
    await fireEvent.press(button("Dersi kaydet"));
    await waitFor(() => expect(screen.getByText("Ders kaydedilemedi. Yeniden deneyin.")).toBeTruthy());
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Öğrenilen dildeki metin").props.value).toBe("Good morning");
  });
});
