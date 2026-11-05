import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { ServicesProvider } from "../../../composition/app-services";
import { fakeServices } from "../../../testing/fake-services";
import { lessonFixture, quizLessonFixture } from "../../../testing/fixtures";
import { QuizScreen } from "./quiz-screen";

const button = (name: string | RegExp) => screen.getByRole("button", { name });
const ANSWERS: Record<string, string> = { apple: "elma", house: "ev", water: "su", book: "kitap" };

async function setup(lessons = [quizLessonFixture()]) {
  const fake = fakeServices();
  for (const lesson of lessons) await fake.repository.save(lesson);
  await render(
    <ServicesProvider services={fake.services}>
      <QuizScreen refreshKey={0} />
    </ServicesProvider>,
  );
  await waitFor(() => expect(button("Quiz başlat")).toBeEnabled());
  return fake;
}

const currentPrompt = () =>
  Object.keys(ANSWERS).find((word) => screen.queryByText(word)) ?? "";

describe("QuizScreen", () => {
  it("ders yokken başlatılamaz", async () => {
    const fake = fakeServices();
    await render(
      <ServicesProvider services={fake.services}>
        <QuizScreen refreshKey={0} />
      </ServicesProvider>,
    );
    await waitFor(() => expect(screen.getByText("Quiz için önce ders oluşturun.")).toBeTruthy());
    expect(button("Quiz başlat")).toBeDisabled();
  });

  it("yeterli eşleşme yoksa açıklar", async () => {
    await setup([lessonFixture()]);
    await fireEvent.press(button("Quiz başlat"));
    expect(screen.getByText(/en az 4 farklı eşleşme/)).toBeTruthy();
  });

  it("seçili dersle sınırlar", async () => {
    await setup([quizLessonFixture(), lessonFixture()]);
    await fireEvent.press(button("Sabah"));
    await fireEvent.press(button("Quiz başlat"));
    expect(screen.getByText(/en az 4 farklı eşleşme/)).toBeTruthy();
  });

  it("baştan sona oynanır, puanı sayar ve yeniden başlar", async () => {
    await setup();
    await fireEvent.press(button("Quiz başlat"));
    expect(screen.getByText("Soru 1 / 4")).toBeTruthy();

    // İlk soru bilerek yanlış, kalanı doğru cevaplanır.
    for (let round = 0; round < 4; round += 1) {
      const prompt = currentPrompt();
      const correct = ANSWERS[prompt] as string;
      const wrong = Object.values(ANSWERS).find((answer) => answer !== correct) as string;
      await fireEvent.press(button(round === 0 ? wrong : correct));
      expect(
        screen.getByText(round === 0 ? `Yanlış. Doğrusu: ${correct}` : "Doğru!"),
      ).toBeTruthy();
      await fireEvent.press(button(round === 3 ? "Sonucu gör" : "Sonraki soru"));
    }
    expect(screen.getByText("Sonuç: 3 / 4")).toBeTruthy();

    await fireEvent.press(button("Yeniden başlat"));
    expect(screen.getByText("Soru 1 / 4")).toBeTruthy();
  });

  it("aynı soruda ikinci cevap puanı değiştirmez", async () => {
    await setup();
    await fireEvent.press(button("Quiz başlat"));
    const correct = ANSWERS[currentPrompt()] as string;
    await fireEvent.press(button(correct));
    expect(button(correct)).toBeDisabled();
  });

  it("soruyu öğrenilen dilde okur", async () => {
    const { speech } = await setup();
    await fireEvent.press(button("Quiz başlat"));
    await fireEvent.press(button("Dinle"));
    expect(speech.speak).toHaveBeenCalledWith(currentPrompt(), "en");
  });
});
