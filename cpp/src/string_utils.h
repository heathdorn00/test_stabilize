#ifndef STRING_UTILS_H
#define STRING_UTILS_H

#include <string>
#include <algorithm>
#include <vector>

namespace utils {

class StringUtils {
public:
    // Convert string to uppercase
    static std::string toUpper(const std::string& str) {
        std::string result = str;
        std::transform(result.begin(), result.end(), result.begin(), ::toupper);
        return result;
    }

    // Convert string to lowercase
    static std::string toLower(const std::string& str) {
        std::string result = str;
        std::transform(result.begin(), result.end(), result.begin(), ::tolower);
        return result;
    }

    // Check if string starts with prefix
    static bool startsWith(const std::string& str, const std::string& prefix) {
        if (prefix.length() > str.length()) {
            return false;
        }
        return str.substr(0, prefix.length()) == prefix;
    }

    // Check if string ends with suffix
    static bool endsWith(const std::string& str, const std::string& suffix) {
        if (suffix.length() > str.length()) {
            return false;
        }
        return str.substr(str.length() - suffix.length()) == suffix;
    }

    // Split string by delimiter
    static std::vector<std::string> split(const std::string& str, char delimiter) {
        std::vector<std::string> tokens;
        std::string token;
        size_t start = 0;
        size_t end = str.find(delimiter);

        while (end != std::string::npos) {
            token = str.substr(start, end - start);
            tokens.push_back(token);
            start = end + 1;
            end = str.find(delimiter, start);
        }

        // Add last token
        tokens.push_back(str.substr(start));
        return tokens;
    }

    // Trim whitespace from both ends
    static std::string trim(const std::string& str) {
        size_t first = str.find_first_not_of(" \t\n\r");
        if (first == std::string::npos) {
            return "";
        }
        size_t last = str.find_last_not_of(" \t\n\r");
        return str.substr(first, (last - first + 1));
    }
};

} // namespace utils

#endif // STRING_UTILS_H
