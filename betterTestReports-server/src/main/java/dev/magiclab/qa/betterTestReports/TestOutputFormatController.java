package dev.magiclab.qa.betterTestReports;

import org.apache.commons.lang3.StringUtils;
import jetbrains.buildServer.controllers.BaseController;
import jetbrains.buildServer.serverSide.FailedTestOutputBean;
import jetbrains.buildServer.serverSide.SBuild;
import jetbrains.buildServer.web.openapi.PluginDescriptor;
import jetbrains.buildServer.web.openapi.WebControllerManager;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;
import org.springframework.web.servlet.ModelAndView;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class TestOutputFormatController extends BaseController implements jetbrains.buildServer.serverSide.FailedTestOutputFormatter {
    private PluginDescriptor myDescriptor;

    private String[][] REPLACES = {
            {
                "PREVIEW_CLASS",
                "better-preview"
            },
            {
                "INTELLIJ_LINK_CLASS",
                "better-intellij-link"
            },
            {
                "BOLT",
                "bolt"
            }
    };

    private String[][] TRANSFORMS = {
            {
                    "(https?://(?:[\\w:\\.]+\\@)?(?:\\w[-\\w\\.]+)(?::\\d{1,5})?(?:\\/(?:[\\w#\\/_\\.!=:-]*(?:\\?\\S+)?)?)?)(\\s+)",
                    "<a href=\"$1\" target=\"_blank\">$1</a>$2"
            },
            {
                    "&gt;&gt;(.+?)&lt;&lt;",
                    "&gt;&gt;<code data-type='square-brackets'>$1</code>&lt;&lt;",
            },
            {
                    "((?:phpunit).+?)(?:\\n|<br>)",
                    "<code data-type='phpunit'>$1</code>\n"
            },
            {
                    "((?:docker.compose.run|..docker.droid.sh).+?)(?:\n|<br>)",
                    "<code data-type='docker'>$1</code>\n",
            },
            {
                    "((?:bundle.exec |TEST_APP=|APP=|APP_BUNDLE_PATH=).+?)(?:\n|<br>)",
                    "<code data-type='bundle_exec_app'>$1</code>\n",
            },
            {
                    "((?:eval).+?)(?:\n|<br>)",
                    "<code data-type='eval'>$1</code>\n",
            },
            {
                    "([\\.\\w-_\\/]+\\.(?:rb|feature):\\d+)(:in)?",
                    "<code data-type='features_and_rb'>$1</code><a href='#' class='${PREVIEW_CLASS} ${INTELLIJ_LINK_CLASS} ${BOLT}' data-ide='rubymine' data-path='$1' title='Open file with RubyMine'></a>$2",
            },
            {
                    "(buildAgent\\/work\\/\\w+\\/)([\\.\\w-_\\/]+\\.php[:(]\\d+[)]?)",
                    "$1<code data-type='files'>$2</code><a href='#' class='${PREVIEW_CLASS} ${INTELLIJ_LINK_CLASS} ${BOLT}' data-ide='phpstorm' data-path='$2' title='Open file with PHPStorm'></a>",
            },
            {
                    "(User: +)(\\d+)([ \\/]+)(\\w+@[\\w.]+)([ \\/]+)(\\w+)",
                    "$1<code>$2</code>$3<code>$4</code>$5<code>$6</code>",
            },
            {
                    "(User(?: ID)?:? +)(\\d+)",
                    "$1<code>$2</code>",
            },
            {
                    "(\\.zip)(</a>)(!\\/.+?)(<br>)",
                    "$1$3$2$4",
            }
    };

    public TestOutputFormatController(WebControllerManager manager, PluginDescriptor descriptor) {
//        manager.registerController("/demoPlugin.html",this);
        myDescriptor = descriptor;
    }

    @Nullable
    @Override
    protected ModelAndView doHandle(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse) throws Exception {
        return new ModelAndView(myDescriptor.getPluginResourcesPath("ExtendedViewLog.jsp"));
    }

    private String replaceWithRegexRules(String output) {
        String result = output;
        result = StringUtils.replaceEach(result, new String[]{"&", "\"", "<", ">"}, new String[]{"&amp;", "&quot;", "&lt;", "&gt;"});
        for (String[] transform : TRANSFORMS) {
            String regex = transform[0];
            String test = "";
            String replacement = transform[1];
            for (String[] toReplaceWith: REPLACES) {
                test = "${" + toReplaceWith[0] + "}";
                replacement = replacement.replace(test, toReplaceWith[1]);
            }
            result = result.replaceAll(regex, replacement);
        }
        return result;
    }

    @Override
    public String formatTestForWeb(@NotNull SBuild sBuild, int testId, @NotNull FailedTestOutputBean failedTestOutputBean) {
        return replaceWithRegexRules(failedTestOutputBean.getCombinedOutput());
    }

    @Override
    public boolean canFormat(@NotNull SBuild sBuild, @NotNull FailedTestOutputBean failedTestOutputBean) {
        return true;
    }
}

