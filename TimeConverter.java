import java.util.Scanner;

/**
 * Converts a time from 12-hour format to 24-hour format.
 *
 * This class is written as a simple BlueJ console program. Open the class in
 * BlueJ, right-click it, choose void main(String[] args), and enter a time such
 * as 07:05 PM when the terminal asks for input.
 */
public class TimeConverter
{
    /**
     * Reads a 12-hour time from the keyboard and prints the matching 24-hour time.
     * Accepted examples: 07:05 PM, 7:05 pm, 12:00 AM, 12:00 PM.
     */
    public static void main(String[] args)
    {
        Scanner input = new Scanner(System.in);

        System.out.print("Enter time in 12-hour format (HH:MM AM/PM): ");
        String time = input.nextLine().trim();

        String convertedTime = convertTo24Hour(time);
        System.out.println("Time in 24-hour format: " + convertedTime);

        input.close();
    }

    /**
     * Converts a 12-hour time string into 24-hour format.
     *
     * @param time a time written as HH:MM AM or HH:MM PM
     * @return the converted time in HH:MM 24-hour format
     */
    public static String convertTo24Hour(String time)
    {
        String[] parts = time.split(" ");
        String[] timeParts = parts[0].split(":");

        int hour = Integer.parseInt(timeParts[0]);
        String minutes = timeParts[1];
        String period = parts[1].toUpperCase();

        if (period.equals("AM"))
        {
            if (hour == 12)
            {
                hour = 0;
            }
        }
        else if (period.equals("PM"))
        {
            if (hour != 12)
            {
                hour = hour + 12;
            }
        }

        return String.format("%02d:%s", hour, minutes);
    }
}
